// 百度地图API功能
var mp = new BMap.Map("allmap", {enableMapClick: false});
//window.map = mp;
mp.centerAndZoom(new BMap.Point(114.363648,36.134863), 13);
mp.enableScrollWheelZoom();

// 添加比例尺空间
mp.addControl(new BMap.NavigationControl());
//mp.addControl(new BMap.NavigationControl({anchor:BMAP_ANCHOR_TOP_RIGHT, type:BMAP_NAVIGATION_CONTROL_SMALL}));
mp.addControl(new BMap.ScaleControl({anchor:BMAP_ANCHOR_TOP_LEFT}));
mp.addControl(new BMap.MapTypeControl({mapTypes:[BMAP_NORMAL_MAP,BMAP_HYBRID_MAP],anchor:BMAP_ANCHOR_BOTTOM_RIGHT}));

$('.form_date').datetimepicker({
        language:  'zh-CN',
        weekStart: 1,
        todayBtn:  1,
		autoclose: 1,
		todayHighlight: 1,
		startView: 2,
		minView: 2,
		forceParse: 0
    });
// 分级变量
var levels = ["green", "yellow", "orange", "red", "purple", "maroon","none"];
var current_uuid = '';

// 创建图表控件
var config = {
    type: 'line',
    data: {
        labels : [],
        datasets : []
    },
    options: {}    
};
var chart = $(".modal-body canvas");    
var ctx = chart[0].getContext("2d");
window.myNewChart = new Chart(ctx, config);

// ***************************************************函数部分****************************************************************
function openStat(){
    $('#statpanel').toggle('slow');
}

function closeStat(){
    $('#statpanel').toggle('slow');
}

function openSite(){
    $('#sitepanel').toggle('slow');
}

function openDownload(){
    $('#myDownloadModal').modal({show:true});
}

function showStat(){
    var type = $('#userStatType').find("option:selected").val();
    var index = $('#userStatIndex').find("option:selected").val();    
    //alert($this.attr('value'));
    var url = "http://www.fangdora.com/envapp/getStatDatabyPast?time=" + type;
    $.get(url, function(data){
        // 判断是否返回准确的数据
        if(data["code"] != 200){
            alert(data['msg']);
        }
        else{                
            //清空地图            
            mp.clearOverlays();            
            var devices = data['data'].filter(function(element, index, array){
                return (element["aqi_value"]);
            });;
           
            for(var i = 0; i < devices.length; i++){        
                
                var p = new BMap.Point(devices[i]["lng"], devices[i]["lat"]);
                var myCompOverlay = new ComplexCustomOverlay(p, devices[i]["title"], devices[i]["uuid"], devices[i][index]);
                devices[i]["comp"] = myCompOverlay;
                mp.addOverlay(myCompOverlay);        
            }
            
            //清空site列表
            $('#sitegroup').empty();
            
            initialzeSitePanel(devices,index);
        } 
    });
}

function downloadData(){
    var site = $('#siteSelected').find("option:selected").text();
    var index = $('#indexSelected').find("option:selected").text();
    var date = $('#userDate').val();
    if(site == "请选择站点" || index == "请选择指标" || date == ""){
        alert("请选择下载参数！");
        return;
    }
    else{
        var site = $('#siteSelected').find("option:selected").val();
        var index = $('#indexSelected').find("option:selected").text();
        var date = $('#userDate').val();
        var url = "http://www.fangdora.com/envapp/getEnvData?id=" + site + "&date=" + date + "&tag=" + index;
        window.location.href = url;
        
    }
}

function selectIndex(){    
    var type = $('#userDetailType').find("option:selected").val();  
    var type_text = $('#userDetailType').find("option:selected").text(); 
    var index = $('#userDetailIndex').find("option:selected").val();
    var index_text = $('#userDetailIndex').find("option:selected").text();
    //var date = $('#userDate').val();
    var url = "http://www.fangdora.com/envapp/getStatDatabyID?id=" + current_uuid  +"&time=" + type;
    
    $.get(url, function(data){        
        // 判断是否返回准确的数据
        if(data["code"] != 200){
            $('#errorMsg').show();
            $('#myChart').hide();
        }
        else{ 
            $('#errorMsg').hide();
            $('#myChart').show();
            config.data.datasets = [];
            config.data.labels = [];
            var info = data["data"];  
            var newDataset = {
                label: type_text + "的" + index_text,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                data : []
            };
            // 遍历info获取数据
            for(var i = 0; i < info.length; i++){
                newDataset.data.push(info[i][index].toFixed(2));
                config.data.labels.push(info[i]["time"]);
            }
            config.data.datasets.push(newDataset);
            // 更新监测图表
            window.myNewChart.update();
        }        
    });    
}

function getFormatDate(){
    var date = new Date();
    var seperator1 = "-";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
}

// 获取所有监测站点并将其加载到地图上
function getMonitorPoints(){ 
    
    var url = "http://www.fangdora.com/envapp/getStatDatabyPast?time=realtime";
    $.get(url, function(data){
        // 判断是否返回准确的数据
        if(data["code"] != 200){
            alert(data['msg']);
        }
        else{                 
            var devices = data['data'].filter(function(element, index, array){
                return (element["aqi_value"]);
            });
            
            for(var i = 0; i < devices.length; i++){        
                var p = new BMap.Point(devices[i]["lng"], devices[i]["lat"]);
                var myCompOverlay = new ComplexCustomOverlay(p, devices[i]["title"], devices[i]["uuid"], devices[i]["aqi_value"]);
                devices[i]["comp"] = myCompOverlay;
                mp.addOverlay(myCompOverlay);        
            }
            
            initialzeSitePanel(devices,"aqi_value");
        }  
    });    
}

function getLevel(aqi){
    if(!aqi){
        return 'none';
    }
    
    if (aqi <= 0){
        return levels[6];
    }
    else if(aqi <= 50 && aqi > 0){
        return levels[0];
    }
    else if(aqi > 50 && aqi <= 100 ){
        return levels[1];
    }
    else if(aqi > 100 && aqi <= 150){
        return levels[2];
    }
    else if(aqi > 150 && aqi <= 200){
        return levels[3];
    }
    else if(aqi > 200 && aqi <= 300){
        return levels[4];
    }
    else{
        return levels[5];
    }
}
//注册数据下载的modal
$('#myDownloadModal').on('shown.bs.modal', function(e){
    //初始化站点列表
    var url = "http://www.fangdora.com/envapp/getAllsites";
    $.get(url, function(data){                        
        var devices = data;
        
        for(var i = 0; i < devices.length; i++){        
            $('#siteSelected').append("<option value='" + devices[i]["uuid"] + "'>" + devices[i]["title"] + "</option>");      
        }        
    });   
    
})

// 注册modal事件
$('#myModal').on('shown.bs.modal', function(e){    
    var a = e.relatedTarget.data;    
    var modal = $(this);
    modal.find('.modal-title').text(a["title"]);  
        
    // 获取监测点编号
    var devid = a["uuid"];
    current_uuid = devid;
    var title = a["title"];
    var date = getFormatDate();
    $('#userDate').val(date);
    // 查询监测点数据
    //var url = "http://service.envicloud.cn:8082/v2/air/daily/device/ZXJ3AW4XNTAWMJCZNTE3NJM1/" + devid + "/" + date;
    var url = "http://www.fangdora.com/envapp/getStatDatabyID?id=" + devid + "&time=realtime";
    //alert(url);
    $.get(url, function(data){
        // 判断是否返回准确的数据
        if(data["code"] != 200){
            $('#errorMsg').show();
            $('#myChart').hide();
        }
        else{                 
            $('#myChart').show();
            var info = data["data"];  
            var newDataset = {
                label: "过去24小时的AQI",
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                data : []
            };
            // 遍历info获取数据
            for(var i = 0; i < info.length; i++){
                newDataset.data.push(info[i]["aqi_value"].toFixed(1));
                config.data.labels.push(info[i]["time"]);
            }
            config.data.datasets.push(newDataset);
            // 更新监测图表
            window.myNewChart.update();
        }        
    });    
});

$('#myModal').on('hidden.bs.modal', function(e){    
    $('#errorMsg').hide();
    $('#myChart').hide();
    config.data.datasets = [];
    config.data.labels = [];
    $('#userDetailType').val('day');
    $('#userDetailIndex').val('aqi_value');
});

// 复杂的自定义覆盖物
function ComplexCustomOverlay(point, name, id, aqi){
    this._point = point;
    this._name = name;
    this._aqi = aqi;
    this._level = getLevel(aqi);
    this._id = id;    
}
ComplexCustomOverlay.prototype = new BMap.Overlay();
ComplexCustomOverlay.prototype.initialize = function(map){
    this._map = map;
    
    // 设置最外层div样式
    var div = this._div = document.createElement("div");
    div.setAttribute("class","outdiv");    
    div.style.MozUserSelect = "none";
    div.style.zIndex = 100;
    
     
    //设置aqi部分的样式
    var span1 = document.createElement('span');   
    
    if(this._aqi <= 0){
        span1.innerHTML = "*"; 
    }
    else{
        span1.innerHTML = this._aqi; 
    }
    //span1.innerHTML = this._aqi;   
    span1.setAttribute("class","site-aqi");
    div.appendChild(span1);
    span1.setAttribute("level",this._level);
    
    //设置名称部分的样式
    var span2 = this._span = document.createElement('span');   
    
    span2.innerHTML = this._name;   
    span2.setAttribute("class","site-name");
    div.appendChild(span2);
    
    //设置箭头的样式
    var div2 = document.createElement('div');
    div2.setAttribute("class","arrow"); 
    div2.setAttribute("arrow_level",this._level);
    //div2.style.borderTopColor = "this._level";

    div.appendChild(div2);
    
    var that = this;
    
    div.onclick = function(){
        var obj = {
            title: "监测点：" + that._name,
            uuid: that._id
        };
        // 显示监测数据
        $('#myModal').modal({show:true}, {data:obj});
    };
    // 鼠标移入，改变div颜色
    div.onmouseover = function(){
        //div.setAttribute("level","default");
        //div2.style.borderTopColor = "darkslateblue";
        //div2.setAttribute("arrow_level","default");
        span2.style.display = "inline";
        div.style.cursor = "pointer";
        div.style.zIndex = 1000;
    };
    // 鼠标移开，恢复div颜色
    div.onmouseout = function(){
        //div.style.border = null;
        span2.style.display = "none";
        div.style.zIndex = 100;
    };

    mp.getPanes().markerPane.appendChild(div);

    return div;
}
ComplexCustomOverlay.prototype.flashIn = function(){
    this._span.style.display = "inline";
    this._div.style.zIndex = 1000;
}
ComplexCustomOverlay.prototype.flashOut = function(){
    this._span.style.display = "none";
    this._div.style.zIndex = 100;
}
ComplexCustomOverlay.prototype.draw = function(){    
    var map = this._map;    
    var pixel = map.pointToOverlayPixel(this._point);
    this._div.style.left = pixel.x - 50 + "px";
    this._div.style.top  = pixel.y - 30 + "px";
}

function initialzeSitePanel(sites,index){
    sites.sort(function(a,b){
        return b.aqi_value - a.aqi_value;
    });
    for(var i = 0; i < sites.length; i++){
        var site = document.createElement('a');
        site.setAttribute("class","list-group-item");
        site.setAttribute("href","javascript:void(0);");
        site.innerHTML = sites[i]["title"];
        site._comp = sites[i]["comp"];
        var span = document.createElement("span");
        span.setAttribute("class","badge");
        
        span.setAttribute("level",getLevel(sites[i][index]));
        if(sites[i][index] <= 0){
            span.innerHTML = "*";
        }
        else{
            span.innerHTML = sites[i][index];
        }
        
        site.appendChild(span);
         
        site._p = new BMap.Point(sites[i]["lng"],sites[i]["lat"]);;
        site.onclick = function(){
            var p = this._p;
            mp.centerAndZoom(p, 14);
            
        };
        site.onmouseover = function(){
            this._comp.flashIn();
        };
        
        site.onmouseout = function(){
            this._comp.flashOut();
        };
        
        $('#sitegroup').append(site);
    }
}

// ----------------------------加载数据部分---------------------------------------
// 获取监测点数据,并将其添加到地图上
getMonitorPoints();