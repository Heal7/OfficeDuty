function login(){
	var stu_id = $('#inputStuid').val();
	var stu_name = $('#inputStuname').val();
	//把学生信息保存到localStorage
	if(typeof(Storage)!=="undefined"){
		localStorage.setItem('stu_id',stu_id);
		localStorage.setItem('stu_name',stu_name);
	}
	window.location.href="./../check/check.html";
	
};

$(function(){
	if(localStorage.getItem('stu_id')){
		window.location.href="./../check/check.html";
	}
	else{
		$(".form-login").on('submit',function(e){
			e.preventDefault();
			login();
		});
	}
});
