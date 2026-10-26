import re
from typing import Dict, Any, Optional, Tuple, List
import sympy as sp
from app.config import settings


def parse_equation(expr_str: str) -> Optional[Tuple[sp.Expr, sp.Expr]]:
    """Parse equation string into LHS and RHS SymPy expressions."""
    if "=" not in expr_str:
        return None
    lhs_str, rhs_str = expr_str.split("=", 1)
    
    # Strip units like m/s^2, N, kg, s
    clean_lhs = clean_expression_string(lhs_str)
    clean_rhs = clean_expression_string(rhs_str)
    
    try:
        lhs = sp.sympify(clean_lhs)
        rhs = sp.sympify(clean_rhs)
        return lhs, rhs
    except Exception:
        return None


def clean_expression_string(s: str) -> str:
    """Remove common physics units and normalize operators."""
    s = s.strip()
    # Remove units from tokens like '4 m/s^2', '50 N'
    s = re.sub(r'\b(m/s\^2|m/s2|m/s|N|kg|s)\b', '', s, flags=re.IGNORECASE)
    # Replace sum_F with sum_F or Sigma_F
    s = re.sub(r'\\Sigma|Σ|sum_F', 'sum_F', s)
    s = re.sub(r'f_k|fk', 'f_k', s)
    s = s.replace("×", "*").replace("÷", "/")
    return s.strip()


def extract_numerical_values(matematis: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract solved or stated values of N, f_k, and a from the math canvas lines.
    """
    values: Dict[str, float] = {}
    if not matematis:
        return values

    baris = matematis.get("baris", [])
    
    # Symbols
    a, N, f_k, F, m, g, mu_k = sp.symbols('a N f_k F m g mu_k')

    for b in baris:
        ekspresi = b.get("ekspresi", "")
        # Direct regex search for standard assignments: e.g. a = 4, N = 50, f_k = 10
        for var_name, sym in [("a", a), ("f_k", f_k), ("N", N)]:
            match = re.search(rf'\b{var_name}\s*=\s*([+-]?\d+(?:\.\d+)?)', ekspresi, re.IGNORECASE)
            if match:
                try:
                    values[var_name] = float(match.group(1))
                    continue
                except ValueError:
                    pass

        # Also try SymPy solving if not directly matched
        eq = parse_equation(ekspresi)
        if eq:
            lhs, rhs = eq
            diff = lhs - rhs
            for var_name, sym in [("a", a), ("f_k", f_k), ("N", N)]:
                if var_name not in values and sym in diff.free_symbols:
                    try:
                        sol = sp.solve(diff, sym)
                        if sol and len(sol) == 1 and sol[0].is_number:
                            values[var_name] = float(sol[0].evalf())
                    except Exception:
                        pass

    return values


def compute_graph_slope(grafis: Dict[str, Any]) -> Optional[float]:
    """Calculate slope from grafis points or stated kemiringan."""
    if not grafis:
        return None
    
    stated_slope = grafis.get("kemiringan")
    if stated_slope is not None:
        return float(stated_slope)

    titik = grafis.get("titik", [])
    if len(titik) >= 2:
        p1 = titik[0]
        p2 = titik[-1]
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        if abs(dx) > 1e-9:
            return float(dy / dx)
    return None


def is_close(val1: Optional[float], val2: Optional[float], rel_tol: float) -> bool:
    if val1 is None or val2 is None:
        return False
    if abs(val2) < 1e-9:
        return abs(val1 - val2) <= rel_tol
    return abs(val1 - val2) / abs(val2) <= rel_tol
