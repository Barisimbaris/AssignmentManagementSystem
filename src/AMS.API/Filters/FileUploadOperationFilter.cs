using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AMS.API.Filters;

public class FileUploadOperationFilter : IOperationFilter
{
	public void Apply(OpenApiOperation operation, OperationFilterContext context)
	{
		var fileParameters = context.MethodInfo.GetParameters()
			.Where(p => p.ParameterType == typeof(Microsoft.AspNetCore.Http.IFormFile))
			.ToList();

		if (!fileParameters.Any())
			return;

		operation.RequestBody = new OpenApiRequestBody
		{
			Content = new Dictionary<string, OpenApiMediaType>
			{
				["multipart/form-data"] = new OpenApiMediaType
				{
					Schema = new OpenApiSchema
					{
						Type = "object",
						Properties = new Dictionary<string, OpenApiSchema>(),
						Required = new HashSet<string>()
					}
				}
			}
		};

		var schema = operation.RequestBody.Content["multipart/form-data"].Schema;

		foreach (var parameter in context.MethodInfo.GetParameters())
		{
			if (parameter.ParameterType == typeof(Microsoft.AspNetCore.Http.IFormFile))
			{
				schema.Properties[parameter.Name!] = new OpenApiSchema
				{
					Type = "string",
					Format = "binary"
				};
				schema.Required.Add(parameter.Name!);
			}
			else if (parameter.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.FromFormAttribute), false).Any())
			{
				var propertyType = parameter.ParameterType;

				schema.Properties[parameter.Name!] = new OpenApiSchema
				{
					Type = propertyType == typeof(int) || propertyType == typeof(int?) ? "integer" : "string"
				};
			}
		}
	}
}