namespace GS.Modelo
{
    public class GaussSeidelRequest
    {
        public double[][] Matrix { get; set; }
        public double[] Results { get; set; }
        public double Tolerance { get; set; } = 0.0001;
        public int MaxIterations { get; set; } = 100;
        public string Criterio { get; set; }

    }

    public class IterationStep
    {
        public int Iteration { get; set; }
        public double[] Values { get; set; }
        public double[] ErrorVector { get; set; }

    }

    public class GaussSeidelResponse
    {
        public string Status { get; set; }
        public bool IsDiagonalDominant { get; set; }
        public List<IterationStep> Procedure { get; set; } = new();
        public double[] FinalSolution { get; set; }
        public double[] Verification { get; set; }
        public List<string> Comparison { get; set; }
    }
}
