import os
from pathlib import Path

DOCKED_IMPORT_ERROR = None
try:
    import method_results.TorchaniCalc.DockedCalc.AniTester as Docked
except Exception as exc:  # pragma: no cover - optional dependency
    Docked = None
    DOCKED_IMPORT_ERROR = exc


DATASET_ROOT = Path(__file__).resolve().parent / "TorchaniCalc" / "datasets"


def _read_charge(file_path):
    with open(file_path, "r", encoding="utf-8") as handle:
        lines = handle.readlines(150)
    return lines[1][7:] if len(lines) > 1 else 0


def _collect_energies(directory):
    if Docked is None:
        raise RuntimeError("TorchANI calculator unavailable") from DOCKED_IMPORT_ERROR
    energies = {}
    for entry in os.scandir(directory):
        if not entry.name.endswith(".xyz"):
            continue
        label = Path(entry.path).stem
        charge = _read_charge(entry.path)
        energies[label] = Docked.runCalc(entry.path, charge)
    return energies


def _dataset_path(dataset_name, subfolder):
    dataset_dir = DATASET_ROOT / dataset_name / subfolder
    if not dataset_dir.exists():
        raise FileNotFoundError(f"No TorchANI data for '{dataset_name}/{subfolder}'.")
    return dataset_dir


def _energy_map(dataset_name):
    ple = _collect_energies(_dataset_path(dataset_name, "PL"))
    le = _collect_energies(_dataset_path(dataset_name, "L"))
    pe = _collect_energies(_dataset_path(dataset_name, "P"))

    labels = sorted(ple.keys())
    energy_map = {}
    for label in labels:
        if label not in le or label not in pe:
            raise ValueError(f"Incomplete TorchANI data for '{dataset_name}' entry '{label}'.")
        energy_map[label] = ple[label] - le[label] - pe[label]
    return energy_map


def giveEnergy(dataset_name="PLA15"):
    return _energy_map(dataset_name)
