def calculate_risk(utci, wbgt, vulnerability):

    # 1. Calculate thermal score

    if utci >= 46 or wbgt >= 32:

        thermal_score = 90

    elif utci >= 38 or wbgt >= 29:

        thermal_score = 75

    elif utci >= 32 or wbgt >= 27:

        thermal_score = 50

    else:

        thermal_score = 25


    # 2. Convert vulnerability to 0-100

    vulnerability_score = vulnerability * 100


    # 3. Calculate final risk

    risk_score = (
        thermal_score * 0.6
        +
        vulnerability_score * 0.4
    )


    # 4. Keep score between 0 and 100

    risk_score = min(
        100,
        max(0, risk_score)
    )


    # 5. Round score

    risk_score = round(
        risk_score,
        2
    )


    # 6. Determine risk level

    if risk_score >= 85:

        risk_level = "EXTREME"

    elif risk_score >= 70:

        risk_level = "HIGH"

    elif risk_score >= 45:

        risk_level = "MODERATE"

    else:

        risk_level = "LOW"


    return {
        "thermal_score": thermal_score,
        "vulnerability_score": vulnerability_score,
        "risk_score": risk_score,
        "risk_level": risk_level
    }