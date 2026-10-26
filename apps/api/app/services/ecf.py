from typing import Dict, Any, Optional
from app.config import settings
from app.services.symbolic import is_close


def evaluate_ecf(
    parameter: Dict[str, Any],
    v: Dict[str, float]
) -> Dict[str, Any]:
    """
    Error carried forward (ECF) logic for N, f_k, a chain.
    """
    m = float(parameter.get("m", 5.0))
    F = float(parameter.get("F", 30.0))
    mu_k = float(parameter.get("mu_k", 0.2))
    g = float(parameter.get("g", 10.0))

    N_key = m * g  # 50 N
    # If student provided N, downstream f_k uses student's N
    student_N = v.get("N", N_key)
    fk_key = mu_k * student_N  # 10 N if N=50
    # Downstream a uses student's f_k
    student_fk = v.get("f_k", fk_key)
    a_key = (F - student_fk) / m  # 4 m/s^2 if fk=10

    root_cause: Optional[str] = None
    is_ecf_valid_downstream: bool = False

    tol = settings.TOL_NILAI_REL

    if "N" in v and not is_close(v["N"], N_key, tol):
        root_cause = "N"
    elif "f_k" in v and not is_close(v["f_k"], mu_k * N_key, tol):
        root_cause = "f_k"
    elif "a" in v and not is_close(v["a"], (F - mu_k * N_key) / m, tol):
        root_cause = "a"

    # Check if downstream is internally consistent despite upstream error
    if root_cause == "N":
        if "f_k" in v and is_close(v["f_k"], mu_k * v["N"], tol):
            is_ecf_valid_downstream = True
            if "a" in v and is_close(v["a"], (F - v["f_k"]) / m, tol):
                is_ecf_valid_downstream = True
    elif root_cause == "f_k":
        if "a" in v and is_close(v["a"], (F - v["f_k"]) / m, tol):
            is_ecf_valid_downstream = True

    return {
        "root_cause": root_cause,
        "is_ecf_valid_downstream": is_ecf_valid_downstream,
        "N_key": N_key,
        "fk_key": fk_key,
        "a_key": a_key,
        "student_values": v
    }
