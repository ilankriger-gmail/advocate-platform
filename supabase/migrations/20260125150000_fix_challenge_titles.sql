-- Fix challenge titles with escaped quotes
-- Corrige os títulos que estão com aspas truncadas

UPDATE challenges
SET title = 'O "Bom Dia"'
WHERE title LIKE 'O "%' AND title NOT LIKE '%Dia%';

UPDATE challenges  
SET title = 'O "Joinha" de Apoio'
WHERE title LIKE 'O "%' AND title NOT LIKE '%Apoio%' AND type = 'atos_amor';

-- Verificar se existem outros títulos problemáticos
-- SELECT title FROM challenges WHERE title LIKE '%"%';
