from typing import Dict, List, Any, Optional
import sympy
from .formula_registry import KPI_REGISTRY

def calculate_kpis(metrics: Dict[str, float], module_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Calculates KPIs based on provided metrics using SymPy formulas.
    
    Args:
        metrics: Dictionary of metric values (e.g., {"issued": 50, "purchased": 100})
        module_filter: Optional module name to filter KPIs (e.g., "environmental", "incidents")
                       If None, returns all calculable KPIs.
    
    Returns a list of KPI result objects with pretty-printed formulas.
    """
    results = []

    for kpi_key, kpi_def in KPI_REGISTRY.items():
        # Filter by module if specified
        if module_filter and kpi_def.get("module") != module_filter:
            continue
            
        # Check if we have all required variables for this KPI
        required_vars = kpi_def["variables"]
        
        # safely get inputs, defaulting to None if missing
        inputs = {var: metrics.get(var) for var in required_vars}
        
        # Check if any input is missing or None
        if any(v is None for v in inputs.values()):
            continue

        try:
            # Create substitution dictionary
            subs_dict = {}
            for var_name in required_vars:
                # Find the symbol object in the formula's free symbols that matches the name
                # (This is a bit robust, though in our registry we know the symbols)
                # Simpler: just use the symbol from the formula expression if possible, 
                # but we need to map string var_name to the symbol.
                # Since we defined symbols globally in registry, let's just use the symbol matching the name.
                # A robust way is to use sympy.symbols again or look it up.
                # However, since we have the formula, we can assume the variables match.
                
                # We need the actual symbol object to substitute.
                # We can grab it from kpi_def['formula'].free_symbols
                symbol_obj = next((s for s in kpi_def['formula'].free_symbols if s.name == var_name), None)
                if symbol_obj:
                    subs_dict[symbol_obj] = inputs[var_name]

            # Calculate result safely
            # Check for division by zero before substituting? 
            # SymPy might handle it or raise exception.
            
            # Check denominators primarily
            # But let's just try/except the eval
            
            result_expr = kpi_def['formula'].subs(subs_dict)
            result_value = float(result_expr.evalf())

            # Pretty print formula
            formula_pretty = sympy.pretty(kpi_def['formula'], use_unicode=False)
            
            # Pretty print substitution (displaying the calculation with numbers)
            # functionality to show " ( 10 / 100 ) * 100 " style is tricky with pure pretty().
            # flexible approach: string format the formula with values
            
            # Let's try to substitute numbers into the formula but keep it unevaluated for display?
            # SymPy eager evaluation might reduce 10/100 to 0.1 immediately.
            # So we will format it manually or use a simple string representation for the 'substitution' view.
            
            substitution_str = str(kpi_def['formula'])
            for var, val in inputs.items():
                substitution_str = substitution_str.replace(str(var), str(val))
            
            # Better: Formula: (issued / purchased) * 100
            # Substitution: (50 / 100) * 100
            
            kpi_result = {
                "key": kpi_key,
                "label": kpi_def["label"],
                "description": kpi_def["description"],
                "formula_pretty": formula_pretty, # Multiline ASCII art if possible, or string
                "formula_str": str(kpi_def['formula']),
                "substitution_pretty": substitution_str,
                "inputs": inputs,
                "result": round(result_value, 2),
                "unit": kpi_def["unit"],
                "status": _determine_status(result_value, kpi_def.get("thresholds"))
            }
            results.append(kpi_result)

        except ZeroDivisionError:
            print(f"Skipping {kpi_key} due to division by zero.")
            continue
        except Exception as e:
            print(f"Error calculating {kpi_key}: {e}")
            continue

    return results

def _determine_status(value: float, thresholds: Dict[str, Any]) -> str:
    """
    Determines status (Good, Warning, Critical) based on value and thresholds.
    """
    if not thresholds:
        return "Unknown"

    good = thresholds["good"]
    critical = thresholds["critical"]
    direction = thresholds["direction"]

    if direction == "higher":
        if value >= good:
            return "Good"
        elif value >= critical:
            return "Warning"
        else:
            return "Critical"
    elif direction == "lower":
        if value <= good:
            return "Good"
        elif value <= critical:
            return "Warning"
        else:
            return "Critical"
    
    return "Unknown"
