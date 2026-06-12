#!/usr/bin/env python3
"""Inspect a STEP assembly with FreeCAD and emit bbox/component metadata."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import FreeCAD as App
import Import


KEYWORDS = (
    "12FAN",
    "FAN",
    "MB",
    "ATX",
    "PSU",
    "SLOT",
    "BRACKET",
    "TRAY",
    "HDD",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("step_file")
    parser.add_argument("--out", required=True)
    parser.add_argument("--limit", type=int, default=80)
    args = parser.parse_args()

    step_file = Path(args.step_file).expanduser().resolve()
    out_file = Path(args.out).resolve()
    out_file.parent.mkdir(parents=True, exist_ok=True)

    doc = App.newDocument("StepIntake")
    Import.insert(str(step_file), doc.Name)
    doc.recompute()

    objects = []
    largest_objects = []
    overall = None

    for obj in doc.Objects:
        shape = getattr(obj, "Shape", None)
        if shape is None or shape.isNull():
            continue
        bbox = shape.BoundBox
        if not is_valid_bbox(bbox):
            continue

        bbox_dict = bbox_to_dict(bbox)
        overall = merge_bbox(overall, bbox_dict)
        label = str(getattr(obj, "Label", "") or getattr(obj, "Name", ""))
        name = str(getattr(obj, "Name", ""))
        upper = f"{label} {name}".upper()
        object_record = {
            "name": name,
            "label": label,
            "bboxMm": bbox_dict,
            "centerMm": bbox_center(bbox_dict),
            "sizeMm": bbox_size(bbox_dict),
        }
        largest_objects.append(object_record)

        if any(keyword in upper for keyword in KEYWORDS):
            objects.append(object_record)

    objects.sort(
        key=lambda item: (
            keyword_rank(f"{item['label']} {item['name']}"),
            item["label"],
            item["name"],
        )
    )

    result = {
        "sourceFile": str(step_file),
        "freecadVersion": App.Version(),
        "units": "mm",
        "objectCount": len(doc.Objects),
        "shapeCount": count_shapes(doc.Objects),
        "overallBboxMm": overall,
        "overallSizeMm": bbox_size(overall) if overall else None,
        "largestObjects": sorted(
            largest_objects,
            key=lambda item: bbox_volume(item["sizeMm"]),
            reverse=True,
        )[: args.limit],
        "matchedObjects": objects[: args.limit],
    }

    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    App.closeDocument(doc.Name)
    return 0


def is_valid_bbox(bbox) -> bool:
    values = [bbox.XLength, bbox.YLength, bbox.ZLength]
    return (
        all(math.isfinite(value) for value in values)
        and any(value > 0 for value in values)
        and all(0 <= value < 10000 for value in values)
        and all(abs(value) < 10000 for value in [bbox.XMin, bbox.XMax, bbox.YMin, bbox.YMax, bbox.ZMin, bbox.ZMax])
    )


def bbox_to_dict(bbox) -> dict[str, float]:
    return {
        "xMin": float(bbox.XMin),
        "xMax": float(bbox.XMax),
        "yMin": float(bbox.YMin),
        "yMax": float(bbox.YMax),
        "zMin": float(bbox.ZMin),
        "zMax": float(bbox.ZMax),
    }


def merge_bbox(left: dict[str, float] | None, right: dict[str, float]) -> dict[str, float]:
    if left is None:
        return dict(right)
    return {
        "xMin": min(left["xMin"], right["xMin"]),
        "xMax": max(left["xMax"], right["xMax"]),
        "yMin": min(left["yMin"], right["yMin"]),
        "yMax": max(left["yMax"], right["yMax"]),
        "zMin": min(left["zMin"], right["zMin"]),
        "zMax": max(left["zMax"], right["zMax"]),
    }


def bbox_center(bbox: dict[str, float]) -> list[float]:
    return [
        round((bbox["xMin"] + bbox["xMax"]) / 2, 4),
        round((bbox["yMin"] + bbox["yMax"]) / 2, 4),
        round((bbox["zMin"] + bbox["zMax"]) / 2, 4),
    ]


def bbox_size(bbox: dict[str, float] | None) -> dict[str, float] | None:
    if bbox is None:
        return None
    return {
        "x": round(bbox["xMax"] - bbox["xMin"], 4),
        "y": round(bbox["yMax"] - bbox["yMin"], 4),
        "z": round(bbox["zMax"] - bbox["zMin"], 4),
    }


def bbox_volume(size: dict[str, float] | None) -> float:
    if size is None:
        return 0
    return size["x"] * size["y"] * size["z"]


def count_shapes(objects) -> int:
    return sum(
        1
        for obj in objects
        if getattr(obj, "Shape", None) is not None and not obj.Shape.isNull()
    )


def keyword_rank(value: str) -> int:
    upper = value.upper()
    for index, keyword in enumerate(KEYWORDS):
        if keyword in upper:
            return index
    return len(KEYWORDS)


if __name__ == "__main__":
    raise SystemExit(main())
