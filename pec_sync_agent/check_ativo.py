import psycopg2
conn = psycopg2.connect(host='localhost', port=5433, dbname='esus', user='postgres', password='0y2hbMOxNT9WiJ4}eB*I9iLg8zPB')
cur = conn.cursor()
cur.execute("SELECT DISTINCT st_ativo, count(*) FROM tb_equipe GROUP BY st_ativo")
for r in cur.fetchall(): print(r)
conn.close()
