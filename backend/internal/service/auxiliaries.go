package service

// auxPercentages maps auxiliary position (1-based) to the CBHPM 5.1 rate.
// Index 0 is unused. CBHPM 2022, item 5.1:
//
//	1st auxiliary → 60%
//	2nd auxiliary → 40%
//	3rd auxiliary → 30%
//	4th auxiliary → 30%
var auxPercentages = [5]float64{0, 0.60, 0.40, 0.30, 0.30}
