-- Test Date Parser Function
SELECT extract_article_date('Caracas: Jueves 03 de Enero de 1878. (Año XI - Mes I No. 2595)') as parsed_date;
SELECT extract_article_date('Lunes 19 de Noviembre de 1877') as parsed_date_2;
