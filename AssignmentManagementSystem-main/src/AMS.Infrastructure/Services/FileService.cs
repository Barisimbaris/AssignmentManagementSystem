using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AMS.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly string _uploadBasePath;

    public FileService()
    {
        // Base path for uploads (you can configure this)
        _uploadBasePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");

        // Create directory if it doesn't exist
        if (!Directory.Exists(_uploadBasePath))
        {
            Directory.CreateDirectory(_uploadBasePath);
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderPath)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is empty");
        }

        // Create folder if it doesn't exist
        var fullFolderPath = Path.Combine(_uploadBasePath, folderPath);
        if (!Directory.Exists(fullFolderPath))
        {
            Directory.CreateDirectory(fullFolderPath);
        }

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(fullFolderPath, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return relative path
        return Path.Combine(folderPath, fileName);
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            var fullPath = Path.Combine(_uploadBasePath, filePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public bool FileExists(string filePath)
    {
        var fullPath = Path.Combine(_uploadBasePath, filePath);
        return File.Exists(fullPath);
    }

    public string GetFileExtension(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant();
    }

    public bool IsValidFileType(string fileName, string[] allowedExtensions)
    {
        var extension = GetFileExtension(fileName);
        return allowedExtensions.Contains(extension);
    }

    public long GetFileSizeInBytes(IFormFile file)
    {
        return file.Length;
    }
}