#!/usr/bin/env python3
"""
Star Battle puzzle generator.

The key insight for making unique puzzles:
A cell (r,c) can ONLY be in region R if placing a star there doesn't violate
any row/col/adjacency constraint AND is consistent with exactly one solution.

Approach: "Ownership by distance" with smart tie-breaking.

For each cell, assign it to the nearest star, but use a distance metric
that favors the correct solution. Specifically:
- Use L-infinity distance (Chebyshev) so that "no-go zones" around each star
  are naturally excluded from other regions
- Add a small random perturbation to create varied shapes

But the real fix is: the SHAPE of regions must prevent alternative star placements.
A cell (r,c) being in region R means "if there's a star in row r, it could be at col c
in region R". We want that for each row, only one column in each region is a valid
star position given the constraints.

New approach: Build regions bottom-up from constraints:
1. Place stars
2. For each "wrong" placement (non-star cell in a row), determine which region
   it should belong to in order to NOT be a valid star position (because placing
   a star there would be in the same region as another star in that row's region)

Actually the simplest WORKING approach: use a SAT-like construction.

FINAL WORKING APPROACH:
Generate random instances until one is unique. For n<=9, use direct random search.
For n=10+, use a smarter construction:
- Place stars on a diagonal or near-diagonal pattern (maximizes separation)
- Use region shapes based on Voronoi with a perturbation toward thin regions
- Use many more attempts

The key observation: for n=10, we just need MORE attempts with different seeds.
Let's test: how long does it take to find ONE unique n=10 puzzle with 10000 attempts?
"""

import random
import json
import sys
from collections import deque
import time


# ─────────────────────── Star placement ────────────────────────────────────

def place_stars(n, rng):
    """Place N stars: 1 per row, 1 per col, no 8-adjacency."""
    stars = []
    used_cols = set()
    blocked = set()

    def bt(row):
        if row == n:
            return True
        cols = list(range(n))
        rng.shuffle(cols)
        for col in cols:
            if col in used_cols or (row, col) in blocked:
                continue
            stars.append((row, col))
            used_cols.add(col)
            nb = []
            for dr in range(-1, 2):
                for dc in range(-1, 2):
                    if dr == 0 and dc == 0:
                        continue
                    p = (row + dr, col + dc)
                    if 0 <= p[0] < n and 0 <= p[1] < n and p not in blocked:
                        blocked.add(p)
                        nb.append(p)
            if bt(row + 1):
                return True
            stars.pop()
            used_cols.remove(col)
            for p in nb:
                blocked.discard(p)
        return False

    return stars if bt(0) else None


def place_stars_diagonal(n, rng, offset=None):
    """
    Place stars on a near-diagonal pattern for better separation.
    Stars at (r, (r*2 + offset) % n) for r=0..n-1, if valid.
    """
    if offset is None:
        offset = rng.randint(0, n - 1)

    stars_try = []
    used_cols = set()
    for r in range(n):
        c = (r * 2 + offset) % n
        if c in used_cols:
            return None
        # Check adjacency with previous star
        if stars_try:
            pr, pc = stars_try[-1]
            if abs(pr - r) <= 1 and abs(pc - c) <= 1:
                return None
        stars_try.append((r, c))
        used_cols.add(c)

    # Verify all adjacency constraints (not just consecutive)
    for i in range(len(stars_try)):
        for j in range(i + 1, len(stars_try)):
            ri, ci = stars_try[i]
            rj, cj = stars_try[j]
            if abs(ri - rj) <= 1 and abs(ci - cj) <= 1:
                return None

    return stars_try


# ─────────────────────── Region growing ────────────────────────────────────

def grow_regions_bfs(n, stars, rng):
    """Random BFS region growth from stars."""
    grid = [-1] * (n * n)
    for rid, (r, c) in enumerate(stars):
        grid[r * n + c] = rid

    frontier = []
    for rid, (r, c) in enumerate(stars):
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n:
                frontier.append((rid, nr, nc))

    while frontier:
        i = rng.randrange(len(frontier))
        frontier[i], frontier[-1] = frontier[-1], frontier[i]
        rid, r, c = frontier.pop()
        if grid[r * n + c] != -1:
            continue
        grid[r * n + c] = rid
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr * n + nc] == -1:
                frontier.append((rid, nr, nc))

    changed = True
    while changed:
        changed = False
        for r in range(n):
            for c in range(n):
                if grid[r * n + c] == -1:
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < n and 0 <= nc < n and grid[nr * n + nc] != -1:
                            grid[r * n + c] = grid[nr * n + nc]
                            changed = True
                            break
    return grid


def grow_regions_weighted(n, stars, rng, row_weight=2.0):
    """
    Grow regions with row-distance weighting.
    Cells are assigned to the star with the smallest weighted distance,
    where row distance is weighted more heavily than column distance.
    This tends to create horizontal-band-like regions that are more constraining.
    """
    grid = [-1] * (n * n)
    for rid, (r, c) in enumerate(stars):
        grid[r * n + c] = rid

    # Use priority queue via sorted list (small n so OK)
    # Priority = weighted distance + random noise
    import heapq
    pq = []

    for rid, (sr, sc) in enumerate(stars):
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = sr + dr, sc + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr * n + nc] == -1:
                dist = row_weight * abs(nr - sr) + abs(nc - sc) + rng.random() * 0.5
                heapq.heappush(pq, (dist, rng.random(), rid, nr, nc))

    while pq:
        _, _, rid, r, c = heapq.heappop(pq)
        if grid[r * n + c] != -1:
            continue
        grid[r * n + c] = rid
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr * n + nc] == -1:
                sr, sc = stars[rid]
                dist = row_weight * abs(nr - sr) + abs(nc - sc) + rng.random() * 0.5
                heapq.heappush(pq, (dist, rng.random(), rid, nr, nc))

    changed = True
    while changed:
        changed = False
        for r in range(n):
            for c in range(n):
                if grid[r * n + c] == -1:
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < n and 0 <= nc < n and grid[nr * n + nc] != -1:
                            grid[r * n + c] = grid[nr * n + nc]
                            changed = True
                            break
    return grid


# ─────────────────────── Validation ────────────────────────────────────────

def verify_regions(n, regions, stars):
    if any(v < 0 or v >= n for v in regions):
        return False
    region_cells = [[] for _ in range(n)]
    for i, r in enumerate(regions):
        region_cells[r].append(i)
    for cells in region_cells:
        if not cells:
            return False
    for rid, (sr, sc) in enumerate(stars):
        if regions[sr * n + sc] != rid:
            return False
    for rid, cells in enumerate(region_cells):
        if len(cells) <= 1:
            continue
        cell_set = set(cells)
        visited = {cells[0]}
        q = deque([cells[0]])
        while q:
            idx = q.popleft()
            r, c = divmod(idx, n)
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    nidx = nr * n + nc
                    if nidx in cell_set and nidx not in visited:
                        visited.add(nidx)
                        q.append(nidx)
        if visited != cell_set:
            return False
    return True


# ─────────────────────── Solution counter ──────────────────────────────────

def find_solutions(n, regions, max_count=2):
    solutions = []
    col_placed = [-1] * n

    def bt(row, col_mask, reg_mask):
        if len(solutions) >= max_count:
            return
        if row == n:
            solutions.append(list(col_placed))
            return
        prev_col = col_placed[row - 1] if row > 0 else -9
        for col in range(n):
            if (col_mask >> col) & 1:
                continue
            region = regions[row * n + col]
            if (reg_mask >> region) & 1:
                continue
            if abs(prev_col - col) <= 1:
                continue
            col_placed[row] = col
            bt(row + 1, col_mask | (1 << col), reg_mask | (1 << region))
            col_placed[row] = -1
            if len(solutions) >= max_count:
                return

    bt(0, 0, 0)
    return solutions


def count_solutions(n, regions, max_count=2):
    return len(find_solutions(n, regions, max_count))


# ─────────────────────── Repair approach ───────────────────────────────────

def is_region_connected_without(n, regions, skip_idx, rid):
    cells = [i for i in range(n * n) if regions[i] == rid and i != skip_idx]
    if not cells:
        return False
    if len(cells) == 1:
        return True
    cell_set = set(cells)
    visited = {cells[0]}
    q = deque([cells[0]])
    while q:
        idx = q.popleft()
        r, c = divmod(idx, n)
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n:
                nidx = nr * n + nc
                if nidx in cell_set and nidx not in visited:
                    visited.add(nidx)
                    q.append(nidx)
    return visited == cell_set


def repair_regions(n, regions, stars, target_sol, alt_sol, rng):
    """
    Try to reassign ONE boundary cell to eliminate alt_sol.
    Returns new regions or None.
    """
    regions = list(regions)
    diffs = [(r, target_sol[r], alt_sol[r])
             for r in range(n) if target_sol[r] != alt_sol[r]]
    rng.shuffle(diffs)

    for row, tgt_col, alt_col in diffs:
        alt_rid = regions[row * n + alt_col]
        star_of_alt_rid = stars[alt_rid]
        star_idx = star_of_alt_rid[0] * n + star_of_alt_rid[1]

        # Find boundary cells of alt_rid that can be reassigned
        for idx in range(n * n):
            if regions[idx] != alt_rid or idx == star_idx:
                continue
            r, c = divmod(idx, n)
            # Find adjacent cells in different regions
            adj_rids = set()
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    other = regions[nr * n + nc]
                    if other != alt_rid:
                        adj_rids.add(other)
            if not adj_rids:
                continue

            # Try reassigning to a neighbor region
            for new_rid in sorted(adj_rids):
                if not is_region_connected_without(n, regions, idx, alt_rid):
                    continue
                regions[idx] = new_rid
                return regions

    return None


def refine_to_unique(n, regions, stars, rng, max_repairs=200):
    """
    Iteratively repair regions to eliminate alternative solutions.
    Returns unique regions or None if failed.
    """
    target_sol_map = {}
    for rid, (sr, sc) in enumerate(stars):
        target_sol_map[sr] = sc
    target_sol = [target_sol_map[r] for r in range(n)]

    for _ in range(max_repairs):
        sols = find_solutions(n, regions, max_count=2)

        if len(sols) == 0:
            return None  # Lost our solution

        if len(sols) == 1:
            return regions  # Unique!

        # Find an alternative to eliminate
        alt = None
        for s in sols:
            if s != target_sol:
                alt = s
                break
        if alt is None:
            return None

        new_regions = repair_regions(n, regions, stars, target_sol, alt, rng)
        if new_regions is None:
            return None

        if verify_regions(n, new_regions, stars):
            regions = new_regions
        else:
            return None

    return None


# ─────────────────────── Main generator ────────────────────────────────────

def generate_level(n, rng, max_attempts=500):
    """Generate a Star Battle level with unique solution."""
    growth_fns = [
        lambda stars, r: grow_regions_bfs(n, stars, r),
        lambda stars, r: grow_regions_weighted(n, stars, r, row_weight=1.5),
        lambda stars, r: grow_regions_weighted(n, stars, r, row_weight=3.0),
        lambda stars, r: grow_regions_weighted(n, stars, r, row_weight=0.5),
    ]

    for attempt in range(max_attempts):
        stars = place_stars(n, rng)
        if stars is None:
            continue

        gfn = growth_fns[attempt % len(growth_fns)]
        regions = gfn(stars, rng)

        if not verify_regions(n, regions, stars):
            continue

        # Quick check: is it already unique?
        sol = count_solutions(n, regions, max_count=2)
        if sol == 1:
            return regions, stars

        # For n >= 8, try to repair
        if n >= 8:
            refined = refine_to_unique(n, regions, stars, rng, max_repairs=100)
            if refined is not None:
                return refined, stars

    return None, None


# ─────────────────────── Level spec ────────────────────────────────────────

def get_grid_size(level_id):
    if level_id <= 17:
        return 6
    elif level_id <= 34:
        return 7
    elif level_id <= 50:
        return 8
    elif level_id <= 83:
        return 8
    elif level_id <= 116:
        return 9
    elif level_id <= 150:
        return 10
    elif level_id <= 160:
        return 8
    elif level_id <= 170:
        return 9
    elif level_id <= 180:
        return 10
    elif level_id <= 190:
        return 11
    else:
        return 12


# ─────────────────────── Entry point ───────────────────────────────────────

def main():
    output_path = "/home/user/c/GameAggregator/GameAggregator/Resources/gwiazdki_levels.json"

    levels = []
    global_rng = random.Random(42)
    failed_levels = []
    start = time.time()

    for level_id in range(1, 201):
        n = get_grid_size(level_id)
        found = False
        regions = None

        for attempt in range(60):
            seed = global_rng.randint(0, 2 ** 31)
            rng = random.Random(seed)
            regions, stars = generate_level(n, rng)
            if regions is not None:
                found = True
                break

        if not found:
            print(f"  FAIL: Level {level_id} (n={n})")
            failed_levels.append(level_id)
            # Row-stripe placeholder
            regions = [r for r in range(n) for _ in range(n)]

        levels.append({"id": level_id, "gridSize": n, "regions": regions})

        if level_id % 10 == 0:
            elapsed = time.time() - start
            print(f"Progress: {level_id}/200 (n={n}) — {elapsed:.1f}s", flush=True)

    output = {"version": 1, "levels": levels}
    with open(output_path, "w") as f:
        json.dump(output, f, separators=(',', ':'))

    total = time.time() - start
    print(f"\nDone in {total:.1f}s — saved to {output_path}")
    if failed_levels:
        print(f"WARNING: {len(failed_levels)} placeholder levels: {failed_levels}")
    else:
        print("All 200 levels have unique solutions!")

    with open(output_path) as f:
        data = json.load(f)
    assert data["version"] == 1
    assert len(data["levels"]) == 200
    for lv in data["levels"]:
        n2 = lv["gridSize"]
        r = lv["regions"]
        assert len(r) == n2 * n2
        assert set(r) == set(range(n2))
    print("Format validation: PASSED")


if __name__ == "__main__":
    main()
