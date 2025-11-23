using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Common.Results
{
    public class Result
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string> Errors { get; set; } = new();

        public static Result Success(string message = "Operation succesful") {
            return new Result { IsSuccess = true, Message = message };
        }

        public static Result Failrue(string eroor) {
            return new Result
            {
                IsSuccess = false,
                Message = "Operation Failed",
                Errors = new List<string> { eroor }
            };
        }
        public static Result Failure(List<string> errors) {
            return new Result
            {
                IsSuccess = false,
                Message = "Operation Failed",
                Errors = errors
            };
        }
        
    }
}
