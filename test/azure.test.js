const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { HttpRequest } = require('@azure/functions');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { MongoStore } = require('connect-mongo');
let memory, handle, cookie;
before(async () => {
 memory = await MongoMemoryServer.create();
 await mongoose.connect(memory.getUri('pets_r_us_adapter'));
 await require('../lib/prepare').prepare();
 const store = MongoStore.create({client:mongoose.connection.getClient(),dbName:mongoose.connection.name,collectionName:'pets_sessions',autoRemove:'disabled'});
 handle = require('../azure/handler').createHandler(require('../app')({store,secret:'a'.repeat(64),secure:true}));
});
after(async () => {await mongoose.disconnect();if(memory)await memory.stop();});
async function call(path, body) {
 const result = await handle(new HttpRequest({url:'https://example.test/api/site/'+path,method:body?'POST':'GET',params:{path},headers:{'content-type':'application/x-www-form-urlencoded',...(cookie?{cookie}:{})},body:body?{string:new URLSearchParams(body).toString()}:undefined}));
 for(const [key,value]of Object.entries(result.headers||{})) if(key.toLowerCase()==='set-cookie') {assert.match(value,/Secure/);assert.match(value,/HttpOnly/);cookie=value.split(';')[0];}
 return result;
}
test('Azure adapter renders EJS and persists secure sessions through registration and appointments',async()=>{
 const page=await call('registration');assert.equal(page.status,200);
 const token=page.body.match(/name="_csrf" value="([^"]+)"/)[1];
 const registered=await call('registration',{_csrf:token,txtUserName:'azurevisitor',email:'azure@example.com',password:'fictional-test-password'});assert.equal(registered.status,302);
 const form=await call('appointment');assert.equal(form.status,200);
 const saved=await call('appointment',{_csrf:form.body.match(/name="_csrf" value="([^"]+)"/)[1],firstName:'Azure',lastName:'Visitor',email:'azure@example.com',service:'grooming'});assert.equal(saved.status,302);
 const profile=await call('profile');assert.equal(profile.status,200);assert.match(profile.body,/Azure Visitor/);
 assert.equal(await require('../models/appointments').countDocuments({isDemo:false}),1);
 assert.equal((await call('appointment',{_csrf:'invalid'})).status,403);
 process.env.DEMO_MAINTENANCE='true';assert.equal((await call('home')).status,503);delete process.env.DEMO_MAINTENANCE;
 assert.equal((await call('home',{text:'x'.repeat(9000)})).status,413);
});
