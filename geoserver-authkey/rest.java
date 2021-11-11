
//要新增的geoserver信息
String user = ""		//用户名
String password = ""	//密码
String role = ""		//角色
String workSpace = ""	//工作区

//添加角色
HttpResponse<String> response = Unirest.post("http://127.0.0.1:7200/geoserver/rest/security/roles/role/"+role)
  .header("Authorization", "Basic YWRtaW46Z2Vvc2VydmVy")
  .asString();

//添加用户
HttpResponse<String> response = Unirest.post("http://192.168.50.198:7200/geoserver/rest/security/usergroup/users/")
  .header("Authorization", "Basic YWRtaW46Z2Vvc2VydmVy")
  .header("Content-Type", "application/xml")
  .body("<?xml version=\"1.0\" encoding=\"UTF-8\"?><user><userName>"+user+"</userName><password>"+password+"</password><enabled>true</enabled></user>")
  .asString();
  
//指定用户角色
HttpResponse<String> response = Unirest.post("http://127.0.0.1:7200/geoserver/rest/security/roles/role/"+role+"/user/"+user)
  .header("Authorization", "Basic YWRtaW46Z2Vvc2VydmVy")
  .asString();

//设置角色访问权限
HttpResponse<String> response = Unirest.post("http://127.0.0.1:7200/geoserver/rest/security/acl/layers")
  .header("Authorization", "Basic YWRtaW46Z2Vvc2VydmVy")
  .header("Content-Type", "application/json")
  .body("{\""+workSpace+".*.r\": \""+role+"\"}")
  .asString();
