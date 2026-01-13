-- Fix LessonPlans table structure
-- Run this script in SQL Server Management Studio if migration fails

USE AssignmentManagementDB;
GO

-- Check if table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LessonPlans')
BEGIN
    PRINT 'LessonPlans table exists';
    
    -- Check and add missing columns
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LessonPlans') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE [LessonPlans] ADD [UpdatedAt] datetime2 NULL;
        PRINT 'Added UpdatedAt column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LessonPlans') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE [LessonPlans] ADD [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE());
        PRINT 'Added CreatedAt column';
    END
    ELSE
    BEGIN
        -- Ensure CreatedAt has default value
        DECLARE @constraintName NVARCHAR(200);
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('LessonPlans') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('LessonPlans'), 'CreatedAt', 'ColumnId');
        
        IF @constraintName IS NULL
        BEGIN
            ALTER TABLE [LessonPlans] ADD CONSTRAINT [DF_LessonPlans_CreatedAt] DEFAULT (GETUTCDATE()) FOR [CreatedAt];
            PRINT 'Added default constraint for CreatedAt';
        END
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LessonPlans') AND name = 'IsDeleted')
    BEGIN
        ALTER TABLE [LessonPlans] ADD [IsDeleted] bit NOT NULL;
        PRINT 'Added IsDeleted column';
    END
    ELSE
    BEGIN
        -- Remove default constraint if exists (EF Core will send value explicitly)
        DECLARE @constraintName2 NVARCHAR(200);
        SELECT @constraintName2 = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('LessonPlans') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('LessonPlans'), 'IsDeleted', 'ColumnId');
        
        IF @constraintName2 IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE [LessonPlans] DROP CONSTRAINT [' + @constraintName2 + ']');
            PRINT 'Removed default constraint for IsDeleted';
        END
    END
    
    -- Check and add foreign key if missing
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_LessonPlans_Classes_ClassId')
    BEGIN
        ALTER TABLE [LessonPlans] ADD CONSTRAINT [FK_LessonPlans_Classes_ClassId] 
        FOREIGN KEY ([ClassId]) REFERENCES [Classes] ([Id]) ON DELETE NO ACTION;
        PRINT 'Added foreign key constraint';
    END
    
    -- Check and add indexes if missing
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LessonPlans_ClassId' AND object_id = OBJECT_ID('LessonPlans'))
    BEGIN
        CREATE INDEX [IX_LessonPlans_ClassId] ON [LessonPlans] ([ClassId]);
        PRINT 'Added IX_LessonPlans_ClassId index';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LessonPlans_WeekNumber' AND object_id = OBJECT_ID('LessonPlans'))
    BEGIN
        CREATE INDEX [IX_LessonPlans_WeekNumber] ON [LessonPlans] ([WeekNumber]);
        PRINT 'Added IX_LessonPlans_WeekNumber index';
    END
    
    PRINT 'LessonPlans table structure verified and fixed';
END
ELSE
BEGIN
    PRINT 'LessonPlans table does not exist. Please run migration first.';
END
GO

