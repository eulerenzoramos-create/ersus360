import psycopg2
conn = psycopg2.connect(host='localhost', port=5433, dbname='esus', user='postgres', password='0y2hbMOxNT9WiJ4}eB*I9iLg8zPB')
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='tb_equipe' ORDER BY ordinal_position")
for r in cur.fetchall(): print(r[0])
conn.close()
