
SELECT	QC.[ID],
		QC.[OPERATION_ID],
		O.[CODE],
		S.[STOCK_NO],
		QC.[MEASURE_NAME],
		QC.[MEASURE],
		QC.[MINUS_MEASURE],
		QC.[MINUS_TOLERANCE],
		QC.[STOCK_ID] 
FROM [SMARTFACTORY].[dbo].[QUALITY_CONTROL] QC
LEFT JOIN [SMARTFACTORY].[dbo].[OPERATION] O
ON QC.[OPERATION_ID] = O.[ID]
LEFT JOIN [SMARTFACTORY].[dbo].[STOCKS] S
ON QC.[STOCK_ID] = S.[ID]
WHERE QC.[MINUS_MEASURE] != (QC.[MEASURE] + QC.[MINUS_TOLERANCE]) AND
	O.[CODE]  IN ('OP340') AND
	QC.[MEASURE_NAME] LIKE '%GÖBEK%'
ORDER BY QC.[ID];


--------------

BEGIN TRANSACTION;

-- Update işlemi
UPDATE [SMARTFACTORY].[dbo].[SHIFTS]
SET 
    [SHIFT2_BREAK2_START] = DATEADD(
                                SECOND,
                                DATEDIFF(SECOND, 0, CAST('23:00:00' AS time)),
                                CAST(CONVERT(date, ISNULL([SHIFT2_BREAK2_START], [DATE])) AS datetime)
                             ),
    [SHIFT2_BREAK2_END]   = DATEADD(
                                SECOND,
                                DATEDIFF(SECOND, 0, CAST('23:30:00' AS time)),
                                CAST(CONVERT(date, ISNULL([SHIFT2_BREAK2_END], [DATE])) AS datetime)
                             )
WHERE [DATE] >= '2025-08-25';

-- Sonuçları kontrol et
SELECT [ID], [DATE], [SHIFT2_BREAK2_START], [SHIFT2_BREAK2_END]
FROM [SMARTFACTORY].[dbo].[SHIFTS]
WHERE [DATE] >= '2025-08-25'
order by [DATE];

-- Doğruysa COMMIT, yanlışsa ROLLBACK
-- COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;
