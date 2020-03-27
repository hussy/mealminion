const mysql = require("./controllers/mysqlCluster.js");
var fileWriter = require('fs')

function insertInfo(user_id){
    return new Promise((resolve,reject) => {
        function randomStr(len, arr) { 
            return new Promise((resolve) => {
                len = len - 14;
                var ans = ''; 
                for (var i = len; i > 0; i--) { 
                    ans += arr[Math.floor(Math.random() * arr.length)]; 
                } 
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                var current_date_time = utc.getFullYear() + "" + (utc.getMonth() + 1) + "" + utc.getDate() + "" +  utc.getHours() + "" + utc.getMinutes() + "" + utc.getSeconds();
                ans += current_date_time;
                resolve(ans);
            });
        } 
        function history(user_id){
            return new Promise((resolve) => {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                var current_date_time = utc.getFullYear() + "-" + (utc.getMonth() + 1) + "-" + utc.getDate() + " " +  utc.getHours() + ":" + utc.getMinutes() + ":" + utc.getSeconds();
                
                var history = {
                    "insert_history": {
                        "user_id": user_id,
                        "timestamp": current_date_time
                    }
                };
                resolve(history);
            });
        }
        randomStr(64, '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            .then(function(result){
                var sync_id = result;
                history(user_id)
                    .then(function(result){
                        var insertInfo = {
                            "sync_devices": {
                                "ON": "1"
                            },
                            "sync_id": sync_id,
                            "history": result
                        };
                        resolve(insertInfo);
                    })
                    .catch(function(error){
                        errorLogger(error);
                        reject(error);
                    })
            })
            .catch(function(error){
                errorLogger(error);
                reject(error);
            })
    });
}

function updateInfo(user_id, table_name, sync_id, new_data){
    return new Promise((resolve,reject) => {
        function history(user_id){
            return new Promise((resolve) => {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                var current_date_time = utc.getFullYear() + "-" + (utc.getMonth() + 1) + "-" + utc.getDate() + " " +  utc.getHours() + ":" + utc.getMinutes() + ":" + utc.getSeconds();
                
                var history = {
                    "insert_history": {
                        "user_id": user_id,
                        "timestamp": current_date_time
                    }
                };
                resolve(history);
            });
        }
        function compare_data(user_id,table_name, sync_id,new_data){
            return new Promise((resolve) => {
                mysql.MainDBquerySelect(table_name,"where sync_id = '" + sync_id + "'","*")
                .then(function(response){
                    if(response.status == "1"){
                        var oldData = response.results[0];
                        var currentHistory = JSON.parse(oldData.history);
                        var difference = {};
                        difference['changes'] = new Array();
                        for(var key in new_data){
                            if(new_data[key] != oldData[key]){
                                difference['changes'].push({ column: key, old_value: JSON.parse(oldData[key]), new_value: new_data[key]});
                            }
                        }
                        try {
                            var toReply = {};
                            var previousUpdates = currentHistory.updated;
                            
                            var now = new Date();
                            var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                            var current_date_time = utc.getFullYear() + "-" + (utc.getMonth() + 1) + "-" + utc.getDate() + " " +  utc.getHours() + ":" + utc.getMinutes() + ":" + utc.getSeconds();
                            previousUpdates.push({
                                user_id: user_id,
                                dateTime: current_date_time,
                                updated_fields: difference['changes']
                            })
                            currentHistory.updated = previousUpdates;
                            toReply['sync_devices'] ={
                                "ON": "1"
                            };
                            toReply['history'] = currentHistory;
                            resolve(toReply)
                        } catch (error) {
                            var toReply = {};
                            var now = new Date();
                            var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                            var temp = [];                            
                            var current_date_time = utc.getFullYear() + "-" + (utc.getMonth() + 1) + "-" + utc.getDate() + " " +  utc.getHours() + ":" + utc.getMinutes() + ":" + utc.getSeconds();
                            temp.push({
                                user_id: user_id,
                                dateTime: current_date_time,
                                updated_fields: difference['changes']
                            })
                            currentHistory.updated = temp;
                            toReply['sync_devices'] ={
                                "ON": "1"
                            };
                            toReply['history'] = currentHistory;
                            resolve(toReply)
                        }
                    } else {
                        throw new Error(response.error)
                    }
                })
                .catch(function(error){
                    errorLogger(error);
                    reject(error);
                })
            });
        }

        compare_data(user_id, table_name,sync_id,new_data)
            .then(function(response){
                resolve(response);
            })
            .catch(function(error){
                errorLogger(error);
                reject(error);
            })
    });
}

function errorLogger(appendText){
    var now = new Date();
    var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    var current_date_time = utc.getFullYear() + "-" + (utc.getMonth() + 1) + "-" + utc.getDate() + " " +  utc.getHours() + ":" + utc.getMinutes() + ":" + utc.getSeconds();
    
    var data = "**************************************\n[" + current_date_time + "]\n" + appendText + "**************************************\n";
    if(Array.isArray(appendText)){
        data = "**************************************\n[" + current_date_time + "]\n" + appendText.toString() + "**************************************\n";
    }
    if(typeof appendText === 'object' && appendText !== null){
        if(JSON.stringify(appendText) == "{}"){
            data = "**************************************\n[" + current_date_time + "]\n" + appendText + "\n";
        } else {
            data = "**************************************\n[" + current_date_time + "]\n" + JSON.stringify(appendText) + "\n";
        }
        
    }
    fileWriter.promises.appendFile("./errorLog.txt",data);
}

function getCountries(){
    return new Promise((resolve,reject) => {
        mysql.MainDBquerySelect("tb_countries","","*")
        .then(function(result){
            if(result.status == "1"){
                resolve(JSON.stringify(result.results));
            } else {
                reject(result.error);
            }
        })
        .catch(function (error){
            reject(error);
        });
    });
}
//get States
function getStates(country_id){
    country_id = country_id.country_id;
    return new Promise((resolve,reject) => {
        mysql.MainDBquerySelect("tb_states","where country_id = '"+country_id+"'","*")
        .then(function(result){
            if(result.status == "1"){
                resolve(JSON.stringify(result.results));
            } else {
                reject(result.error);
            }
        })
        .catch(function (error){
            reject(error);
        });
    });
}
//get city
function getCity(state_id){
    state_id = state_id.state_id;
    return new Promise((resolve,reject) => {
        mysql.MainDBquerySelect("tb_cities","where state_id = '"+state_id+"'","*")
        .then(function(result){
            if(result.status == "1"){
                resolve(JSON.stringify(result.results));
            } else {
                reject(result.error);
            }
        })
        .catch(function (error){
            reject(error);
        });
    });
}
//Get currencies
function getCurrencies(){
    return new Promise((resolve,reject) => {
        mysql.MainDBquerySelect("tb_currencies","order by currency_name asc","*")
        .then(function(result){
            if(result.status == "1"){
                resolve(JSON.stringify(result.results));
            } else {
                reject(result.error);
            }
        })
        .catch(function (error){
            reject(error);
        });
    });
}


module.exports.getCurrencies = getCurrencies;
module.exports.getCity = getCity;
module.exports.getStates = getStates;
module.exports.getCountries = getCountries;
module.exports.errorLogger = errorLogger;
module.exports.insertInfo = insertInfo;
module.exports.updateInfo = updateInfo;