import pandas as pd
from ml_v2.splits import chronological_split

def test_chronological_split():
    df = pd.DataFrame({'timestamp': pd.to_datetime(['2021-01-01', '2022-01-01', '2023-01-01'])})
    tr, val, te = chronological_split(df, '2021-12-31', '2022-12-31')
    assert len(tr) == 1
    assert len(val) == 1
    assert len(te) == 1
