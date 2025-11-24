using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file, string folderPath);
        Task<bool> DeleteFileAsync(string filePath);
        bool FileExists(string filePath);
        string GetFileExtension(string fileName);
        bool IsValidFileType(string fileName, string[] allowedExtensions);
        long GetFileSizeInBytes(IFormFile file);
    }
}
