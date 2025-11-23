using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Common.Results
{
    public class Result<T> : Result
    {
        public T? Data { get; set; }
        public static Result<T> Success(T data, string message = "Operation Succesful") {
            return new Result<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data
            };
        }
        public new static Result<T> Failure(string error) {

            return new Result<T>
            {
                IsSuccess = false,
                Message = "Operation failed",
                Errors = new List<string> { error }
            };

        }

        public new static Result<T> Failure(List<string> errors){
            return new Result<T>
            {
                IsSuccess = false,
                Message = "Operation failed",
                Errors=errors
            };
}

    }
}
