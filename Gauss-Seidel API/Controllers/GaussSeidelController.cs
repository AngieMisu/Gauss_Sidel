using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Collections.Generic;
using GS.Modelo;

namespace GS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GaussSeidelController : ControllerBase
    {
        [HttpPost("solve")]
        public ActionResult<GaussSeidelResponse> Solve([FromBody] GaussSeidelRequest request)
        {
            int n = request.Results.Length;

            // VALIDAR MATRIZ CUADRADA
            if (request.Matrix.Length != n || request.Matrix.Any(r => r.Length != n))
            {
                return BadRequest(new GaussSeidelResponse
                {
                    Status = "Error: La matriz debe ser cuadrada.",
                    IsDiagonalDominant = false,
                    Procedure = new List<IterationStep>()
                });
            }

            // VALIDAR DIAGONAL DOMINANTE
            for (int i = 0; i < n; i++)
            {
                double suma = 0;

                for (int j = 0; j < n; j++)
                {
                    if (i != j)
                        suma += Math.Abs(request.Matrix[i][j]);
                }

                if (Math.Abs(request.Matrix[i][i]) < suma)
                {
                    return BadRequest(new GaussSeidelResponse
                    {
                        Status = "Error: La matriz no es diagonalmente dominante.",
                        IsDiagonalDominant = false,
                        Procedure = new List<IterationStep>()
                    });
                }
            }

            var response = new GaussSeidelResponse
            {
                IsDiagonalDominant = true,
                Procedure = new List<IterationStep>()
            };

            double[] x = new double[n];
            double[] prev = new double[n];

            bool usarError = request.Criterio == "error";

            for (int k = 1; k <= request.MaxIterations; k++)
            {
                Array.Copy(x, prev, n);

                // GAUSS-SEIDEL ITERACIÓN
                for (int i = 0; i < n; i++)
                {
                    double sum = request.Results[i];

                    for (int j = 0; j < n; j++)
                    {
                        if (i != j)
                            sum -= request.Matrix[i][j] * x[j];
                    }

                    x[i] = sum / request.Matrix[i][i];
                }

                // 🔥 ERROR PORCENTUAL POR VARIABLE
                double[] errorVec = new double[n];

                for (int i = 0; i < n; i++)
                {
                    if (x[i] != 0)
                        errorVec[i] = Math.Abs((x[i] - prev[i]) / x[i]) * 100;
                    else
                        errorVec[i] = 0;
                }

                response.Procedure.Add(new IterationStep
                {
                    Iteration = k,
                    Values = (double[])x.Clone(),
                    ErrorVector = errorVec
                });

                // 🔥 CRITERIO DE PARADA
                if (usarError)
                {
                    bool stop = errorVec.Max() < request.Tolerance;

                    if (stop)
                    {
                        response.Status = "Convergió por porcentaje de error.";
                        break;
                    }
                }
                else
                {
                    if (k >= request.MaxIterations)
                    {
                        response.Status = "Convergió por número de iteraciones.";
                        break;
                    }
                }

                if (k == request.MaxIterations && response.Status == null)
                {
                    response.Status = "Se alcanzó el máximo de iteraciones.";
                }
            }

            response.FinalSolution = x;

            return Ok(response);
        }
    }
}