-- Correct auxiliary counts that were seeded as zero despite positive values
-- in the CBHPM 2022 Chapter 3 "N° de Aux." column.
-- Source: data/raw_pdfs/CBHPM-2022.pdf, Chapter 3.
-- Idempotent: safe to apply to existing installations.
UPDATE cbhpm_codes SET num_auxiliaries = 1 WHERE code = '3.06.01.02-9' AND num_auxiliaries IS DISTINCT FROM 1;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.06.01.19-3' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.01-6' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.02-4' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 1 WHERE code = '3.07.15.03-2' AND num_auxiliaries IS DISTINCT FROM 1;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.10-5' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.11-3' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.16-4' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.17-2' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 1 WHERE code = '3.07.15.18-0' AND num_auxiliaries IS DISTINCT FROM 1;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.21-0' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.22-9' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.24-5' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.26-1' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.28-8' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.31-8' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.36-9' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.38-5' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.39-3' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.15.59-8' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 2 WHERE code = '3.07.32.02-6' AND num_auxiliaries IS DISTINCT FROM 2;
UPDATE cbhpm_codes SET num_auxiliaries = 3 WHERE code = '3.09.10.13-7' AND num_auxiliaries IS DISTINCT FROM 3;
UPDATE cbhpm_codes SET num_auxiliaries = 1 WHERE code = '3.14.03.03-4' AND num_auxiliaries IS DISTINCT FROM 1;
