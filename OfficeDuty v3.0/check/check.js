var stu_id = localStorage.getItem('stu_id');
var stu_name = localStorage.getItem('stu_name');
$('a')[0].innerHTML = stu_name;//页面显示用户姓名
//创建值班签到事件对象
var CheckObj = AV.Object.extend('CheckObj');
var checkObj = new CheckObj();
// var _local_data = {//值班签到对象的本地数据格式
// 	stuId:'',
// 	stuName:'',
// 	reserveTime:[],
// 	checkEvent:[],
// 	checkTime:[]
// };
console.log(stu_id);
console.log(stu_name)
//设置点击表格对应的时间
function setReserve(i,index){
	var weekNum = index;
	if(weekNum == 0){ weekNum = 7;}
	var aorp = Math.floor(i/7)+1;
	var x;
	switch(aorp){
		case 1: x='AM1';break;
		case 2: x='AM2';break;
		case 3: x='PM1';break;
		case 4: x="PM2";break;
	}
	return weekNum + x;//星期+时间段
}
//设置当前时间对应的表格相对时间段
function getTime(){
	var date = new Date();
	var currentWeek = date.getDay();
	if(currentWeek == 7){ currentWeek = 7;}
	var currentHour = date.getHours();
	var currentPeriod;//当前时间段
	switch(currentHour){
		case 8 : currentPeriod = 'AM1';break;
		case 9 : currentPeriod = 'AM1';break;
		case 10 : currentPeriod = 'AM2';break;
		case 11 : currentPeriod = 'AM2';break;
		case 14 : currentPeriod = 'PM1';break;
		case 15 : currentPeriod = 'PM1';break;
		case 16 : currentPeriod = 'PM2';break;
		case 17 : currentPeriod = 'PM2';break;
		case 18 : currentPeriod = 'PM2';break;
		case 19 : currentPeriod = 'PM2';break;
	}
	return currentWeek + currentPeriod;
}

//一周后页面数据清空，服务器数据仍存在，那要如何判断点击表格时是添加还是删除预约时间
//1、定期清除后台数据（需人工管理）  2、根据页面数据是否存在该学号判断是添加还是删除，写个时间函数清空页面数据
//3、不清空数据，一周后数据仍在，由用户选择点击表格删除，或添加其他预约时间
//目前第一种
//预约值班
function reserveDuty(){
	var td = $('td');
	for(var i = 0; i < td.length; i++){
		(function(i){
			btnTable(i) ;
		})(i)
	}

	function btnTable(i){
		td[i].onclick = function(){
			var index = $(this).index();//点击了第几个td，即星期几
			var r = setReserve(i,index);//星期+时间段
			//查找服务器数据
			var query = new AV.Query('CheckObj');
			query.equalTo('stuId',stu_id);//找到id为stu_id的对象
			query.find().then(function(result){
				console.log(result)
				var check = result[0];
				if(check!=undefined){
					var reserveTime = check.get('reserveTime');
					var checkEvent = check.get('checkEvent');
					var checkTime = check.get('checkTime');
					//若该预约时间存在，则删除
					if(reserveTime.indexOf(r) != -1){
						for(var j= 0 ; j < reserveTime.length ; j++){
							if(reserveTime[j]==r){
								reserveTime.splice(j,1);
								checkEvent.splice(j,1);
								checkTime.splice(j,1);
							}
						}
					}
					//若不存在则添加
					else{
						reserveTime.push(r);
						checkEvent.push([]);
						checkTime.push([]);
					}
					//更新对象
					check.set('reserveTime',reserveTime);
					check.set('checkEvent',checkEvent);
					check.set('checkTime',checkTime);
					check.save().then(function(checkObj){
					},function(error){
						console.error(error);
					});
					
				}
				else{
					var reserveTime = [],checkEvent=[],checkTime=[];
					//添加对象
					reserveTime.push(r);
					checkEvent.push([]);
					checkTime.push([]);
					checkObj = new CheckObj();
					checkObj.set('stuId',stu_id);
					console.log(stu_id)
					checkObj.set('stuName',stu_name);
					checkObj.set('reserveTime',reserveTime);
					checkObj.set('checkEvent',checkEvent);
					checkObj.set('checkTime',checkTime);
					checkObj.save().then(function(CheckObj){
						//成功储存
					},function(error){
						console.error(error);
					});
					
				}

			});
		}
	}
}

//只有预约了值班时间才能签到还是不论是否预约都能签到？
//目前第一种
//监听签到
function btnCheck(){
	var btn_check = $('button')[0];
	//获取服务器对象数据
	var query = new AV.Query('CheckObj');
	query.equalTo('stuId',stu_id);
	query.find().then(function(result){
		var check = result[0];
		if(check!=undefined){
			var reserveTime = check.get('reserveTime');
			var checkEvent = check.get('checkEvent');
			var checkTime = check.get('checkTime');
			btn_check.onclick = function(){
				//获取当前时间
				var currentTime = getTime();
				if(reserveTime.indexOf(currentTime)!=-1){
					for(var m = 0; m < reserveTime.length; m++){
						if(currentTime == reserveTime[m]){
							if(checkEvent[m].length == 0){
								checkEvent[m].push('签到成功');
								checkTime[m].push(new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+'点');
							}
							if(checkEvent[m].length == 1){
								checkEvent[m].push('签退成功');
								checkTime[m].push(new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+'点');
							}
						}
					}
					//更新对象
					check.set('checkEvent',checkEvent);
					check.set('checkTime',checkTime);
					check.save().then(function(checkObj){
					},function(error){
						console.error(error);
					});
				}
				else{
					alert('您不在当前值班时间段，无需签到！');
				}
				
			}
			
		}

	});
}	

//渲染表格,需要实时更新，当服务器数据更新时刷新
//获取服务器数据中的reserveTime,渲染到相应的方块
function showTable(){
	var query = new AV.Query('CheckObj');
	query.equalTo('stuId',stu_id);
	query.find().then(function(result){
		var check = result[0];
		if(check!=undefined){
			var reserveTime = check.get('reserveTime');
			// console.log(reserveTime)
			var td = $('td');
			for(var i = 0;i<td.length; i++){
				td[i].innerHTML = '';
			}
			for(var k = 0; k < reserveTime.length; k++){	
				var weekNum = reserveTime[k].slice(0,1);//星期几
				var period = reserveTime[k].slice(1);//AM1 AM2 PM1 PM2时间段
				switch(period){
					case 'AM1': period = 1 ;break;
					case 'AM2': period = 2;break;
					case 'PM1': period = 3;break;
					case 'PM2': period = 4;break;
				}
				//渲染表格
				var trd = document.getElementsByTagName('tr')[period].getElementsByTagName('td')[weekNum-1];
				if(trd.innerHTML.indexOf(stu_id)==-1){
					trd.innerHTML += '<p>'+stu_id+'</p><p>'+stu_name+'</p>';
				}
			}
		}
	});

}
//渲染按钮
//若签到时间数据内有当前时间，则渲染
function showBtn(){	
	var btn_check = $('button')[0];
	btn_check.innerHTML = '今日签到';
	var query = new AV.Query('CheckObj');
	query.equalTo('stuId',stu_id);
	query.find().then(function(result){
		var check = result[0];
		if(check!=undefined){
			var checkTime = check.get('checkTime');
			var currentTime = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+'点';
			for( var k = 0; k < checkTime.length; k++){
				if(currentTime == checkTime[k][0] && checkTime[k].length==1){
					console.log(checkTime[k][0])
					btn_check.innerHTML = '签到成功';
				}
				else if(currentTime == checkTime[k][1] && checkTime[k].length==2){
					btn_check.innerHTML = '签退成功';
				}
			}
		}
	});	
}
		
//退出登录
function logout(){
	var btnLogout = $('li')[1];
	btnLogout.onclick = function(){
		localStorage.clear();
		window.location.href="./../login/login.html";
	}
}


//若用户已登录则调用事件，否则回到登录页面
$(function(){
	if(localStorage.getItem('stu_id')){
		reserveDuty();
		window.setInterval("showTable()",1000);//每隔1000ms调用一个函数，请求数据渲染表格。如何写当服务器数据更新时实时更新页面数据，有待学习
		btnCheck();
		showBtn();
		logout();
	}
	else{
		window.location.href="./../login/login.html";
	}
});
