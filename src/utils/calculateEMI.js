// EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
export default function calculateEMI(principal, annualRatePercent, tenureMonths) {
  const P = Number(principal) || 0
  const r = (Number(annualRatePercent) || 0) / 12 / 100
  const n = Number(tenureMonths) || 0
  if (P <= 0 || r <= 0 || n <= 0) return 0
  const numerator = P * r * Math.pow(1 + r, n)
  const denominator = Math.pow(1 + r, n) - 1
  return Math.round((numerator / denominator) * 100) / 100
}
export const calculateEMI = (principal, rate, tenure) => {
  const monthlyRate = rate / (12 * 100);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1);
  return emi.toFixed(2);
};
