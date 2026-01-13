-- ClassSchedule Table Creation Script
-- Run this in SQL Server Management Studio or Azure Data Studio

USE [AssignmentManagementSystemDb] -- Your database name
GO

-- Create ClassSchedules table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ClassSchedules' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[ClassSchedules](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ClassId] [int] NOT NULL,
        [DayOfWeek] [int] NOT NULL, -- 0=Sunday, 1=Monday, etc.
        [StartTime] [time](7) NOT NULL,
        [EndTime] [time](7) NOT NULL,
        [RoomNumber] [nvarchar](100) NULL,
        [Building] [nvarchar](200) NULL,
        [Notes] [nvarchar](500) NULL,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [IsDeleted] [bit] NOT NULL DEFAULT 0,
        CONSTRAINT [PK_ClassSchedules] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_ClassSchedules_Classes_ClassId] FOREIGN KEY([ClassId])
            REFERENCES [dbo].[Classes] ([Id]) ON DELETE CASCADE
    )

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX [IX_ClassSchedules_ClassId] ON [dbo].[ClassSchedules]([ClassId])
    CREATE NONCLUSTERED INDEX [IX_ClassSchedules_DayOfWeek_StartTime] ON [dbo].[ClassSchedules]([DayOfWeek], [StartTime])
    CREATE NONCLUSTERED INDEX [IX_ClassSchedules_RoomNumber_DayOfWeek] ON [dbo].[ClassSchedules]([RoomNumber], [DayOfWeek]) WHERE [RoomNumber] IS NOT NULL

    PRINT 'ClassSchedules table created successfully!'
END
ELSE
BEGIN
    PRINT 'ClassSchedules table already exists!'
END

-- Insert sample data (optional)
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[ClassSchedules])
BEGIN
    INSERT INTO [dbo].[ClassSchedules] ([ClassId], [DayOfWeek], [StartTime], [EndTime], [RoomNumber], [Building], [Notes], [IsActive])
    VALUES 
    (1, 1, '09:00:00', '10:30:00', 'A101', 'Engineering Building', 'CS101 Lecture - Monday', 1),
    (1, 3, '09:00:00', '10:30:00', 'A101', 'Engineering Building', 'CS101 Lecture - Wednesday', 1),
    (1, 5, '09:00:00', '10:30:00', 'B201', 'Engineering Building', 'CS101 Lab - Friday', 1)
    
    PRINT 'Sample schedule data inserted!'
END

GO