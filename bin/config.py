import pygit2_backends

mysql_hostname = "localhost"
mysql_username = "root"
mysql_password = "123456"
mysql_dbname = "idegit"
mysql_portno = 3307
mysql_unix_socket = None

def get_repo():
    return pygit2_backends.MysqlRepository(mysql_hostname, mysql_username, mysql_password, mysql_dbname, mysql_portno, mysql_unix_socket)
