$(function(){
  Map = new SlimeMap();
  $(".button").button();
  
  $("#map").mousewheel(function(event, delta) {
    Map.setzoom(Map.zoom + Map.zoom/4*delta);

    return false
  });
  $("#map_seed").on( "change", function(){
      if ($(this).val().length !== 0) {
        seed = Int64.fromString($(this).val()) || int64(hashCode($(this).val()));
        Map.setseed(seed);
      }
  });
  $("#map_seed").on( "keydown", function(){
    console.log("test");
      if ($(this).val().length !== 0) {
        seed = Int64.fromString($(this).val()) || int64(hashCode($(this).val()));
        Map.setseed(seed);
      }
  });
  $("#map_zoom").slider({value:30,max: 200}).bind( "slide", function(event, ui) {Map.setzoom( $(this).slider("value"))});
  $(document).keydown(function(e){
    switch (e.keyCode){
      case 37:
        Map.x--
        break;
      case 38:
        Map.y--
        break
      case 39:
        Map.x++
        break
      case 40:
        Map.y++
        break;
      default:
        break;
    }
    if (e.keyCode >=37 && e.keyCode <= 40 && Map.step ==0){
      Map.step =30;
    }
  })
  $("#map").mousedown(function(e) {
     $(this).css('cursor', 'move');
     var bx = e.pageX;
     var by = e.pageY;
     $(document).on('mousemove.move', function(e) {
       Map.x += (bx - e.pageX)/Map.zoom*16;
       bx = e.pageX;
       Map.y += (by - e.pageY)/Map.zoom*16;
       by = e.pageY;
     if (Map.step ==0)Map.step =30;
       return false;
     }).one('mouseup', function() {
       $('#map').css('cursor', 'auto');
       $(document).off('mousemove.move');
     });
     return false;
   });
  
  timer = setInterval("Map.animate()" , 1000/30);
})



var SlimeMap = function(){
  this.canvas = $("#map").get(0);
  if ( ! this.canvas || ! this.canvas.getContext ) { return false; }
  this.ctx = this.canvas.getContext('2d');
  this.tmpzoom = ($.query.get('zoom'))?$.query.get('zoom'):30;
  this.zoom = ($.query.get('zoom'))?$.query.get('zoom'):30;
  this.step = 30;
  this.fps = 30;
  this.width = 480;
   this.height = 480;
  this.x = ($.query.get('x'))?$.query.get('x'):0;
  this.y = ($.query.get('z'))?$.query.get('z'):0;
  this.padding_x = 40;
  this.padding_y = 80;
  this.ctx.lineWidth=1;
  this.seed = Int64.fromString(($.query.get('seed'))?$.query.get('seed'):"1");

  this.logo_img = new Image()
  this.logo_img.src = "images/logo.png";
  this.url_img = new Image()
  this.url_img.src = "images/url.png";
  this.slime_img = new Image()
  this.slime_img.src = "images/slime.png";
  this.version = "0.5";
  this.chunkcache = new Array(1000);
  this.chunkImagecache = new Array(1000);  
  
    $("#map_zoom").slider( {"value": this.tmpzoom} );
    $("#map_zoom_input").val( this.tmpzoom );
    $("#map_seed").val(~~this.seed);
      
  for ( var i = 0 ; i < 1000 ; i++ ){
      this.chunkcache[i] = new Array(1000); 
      this.chunkImagecache[i] = new Array(1000);   
  }
  
  this.animate = function(){
    if (this.step ==0){
      
    }else if (this.step == this.fps){
      this.zoom = this.tmpzoom;
      this.step = 0;
      this.render(this.zoom);
      return
    }else{
      var diff = this.tmpzoom - this.zoom;
      
      this.render(this.zoom + (1-Math.pow(1-this.step/this.fps,3))*diff);
      this.step++;
      return
    }
  },
  this.setzoom = function(zoom){
    if (this.step>0){
      var diff = this.tmpzoom - this.zoom;
      this.zoom = (this.zoom +  (1-Math.pow(1-this.step/this.fps,3))*diff);
    }
    this.tmpzoom = ~~(zoom);
    if (this.tmpzoom >= 200) this.tmpzoom = 200
    if (this.tmpzoom <= 4) this.tmpzoom = 4
    this.step = 1;
    $("#map_zoom").slider( "value", this.tmpzoom );
    $("#map_zoom_input").val( this.tmpzoom );
  }
  this.setseed =function(seed){
    this.seed = Int64.fromString(seed);
    this.chunkcache = new Array(1000) 
    for ( var i = 0 ; i < 1000 ; i++ )
        this.chunkcache[i] = new Array(1000);   
    this.render(this.zoom);
  }
  this.render = function(zoom){
    //$("h1").html(""+zoom+":"+this.tmpzoom+"<BR>"+this.step)
    
         $("#map_x").val(~~this.x);
         $("#map_y").val(~~this.y);
      
    this.ctx.clearRect(0,0,560,600);
        /* 画像を描画 */
      this.ctx.drawImage(this.slime_img, 560/2-220/2-55, 0,45,50);
      this.ctx.drawImage(this.logo_img, 560/2-220/2, 0);
      this.ctx.drawImage(this.url_img, 560/2+220/2+50, 0);
    
    
            this.ctx.fillStyle = "rgb(50,50,50)";
            this.ctx.textAlign = "left";
          this.ctx.font = '12px Myriad';
      this.ctx.fillText("Version:"+this.version, 560/2+220/2+50, 30);
      
    var row = ~~this.width/zoom;
    var line = ~~this.width/zoom;
    
    
    var cell_width = zoom;
    var cell_height = zoom;
    var fix_x = (this.x%16)/16*cell_width
    var fix_y = (this.y%16)/16*cell_height
    if (fix_x < 0) fix_x = cell_width+fix_x
    if (fix_y < 0) fix_y = cell_height+fix_y
    
    var pad_x = 40 -fix_x + (this.width-Math.floor(row/2)*2*cell_width)/2;
    var pad_y = 40 -fix_y + (this.width-Math.floor(line/2)*2*cell_height)/2;  
    

    var pad_x = this.padding_x + this.width%(cell_width*2)/2    - ((this.x%16)/16*cell_width  +cell_width)%cell_width;
    var pad_y = this.padding_y + this.height%(cell_height*2)/2    - ((this.y%16)/16*cell_height  +cell_width)%cell_width;

    this.printCell(zoom);
    
    for(var i =-1;i<=row;i++){
      for(var j =-1;j<=line;j++){
        var chunk_x = Math.floor(this.x/16) + i - Math.floor(row/2);
        var chunk_y = Math.floor(this.y/16) + j - Math.floor(line/2);
        this.ctx.beginPath();
        
        if (this.chunkcache[chunk_x+500][chunk_y+500] == undefined){
          this.chunkcache[chunk_x+500][chunk_y+500] = isSlimeChunk(this.seed,chunk_x,chunk_y)
        }
        
          var tmp_x = Math.max(pad_x+i*cell_width+1,this.padding_x);
          var tmp_y = Math.max(pad_y+j*cell_height+1,this.padding_y);
        if(this.chunkcache[chunk_x+500][chunk_y+500]){
           this.ctx.fillStyle = 'rgba(100,255,100,0.6)'; // 緑
          
          
          var tmp_x = Math.max(pad_x+i*cell_width+1,this.padding_x);
          var tmp_y = Math.max(pad_y+j*cell_height+1,this.padding_y);
          
          
          var tmp_width  = null;
          
          if(tmp_x + cell_width > this.width + this.padding_x){
            //右
            tmp_width = cell_width - ( tmp_x + cell_width - (this.width + this.padding_x) );
          }else if(tmp_x == this.padding_x ){
            //左
            tmp_width = cell_width -2 - (tmp_x-(pad_x+(i)*cell_width +1));
          }else if (tmp_x==pad_x+i*cell_width+1){
            tmp_width  =cell_width-2;
          }else{
            console.log("bug:"+tmp_x)  
          }
          

          
          var tmp_height  = null;
          
          if(tmp_y + cell_height > this.height + this.padding_y){
            //右
            tmp_height = cell_height - ( tmp_y + cell_height - (this.height + this.padding_y) );
          }else if(tmp_y == this.padding_y ){
            //左
            tmp_height = cell_height -2 - (tmp_y-(pad_y+(j)*cell_height +1));
          }else if (tmp_y==pad_y+j*cell_height+1){
            tmp_height  =cell_height-2;
          }else{
            console.log("bug:"+tmp_y)  
          }
          
          
          if(tmp_width >0 &&tmp_height > 0) this.ctx.fillRect( tmp_x,tmp_y,   tmp_width, tmp_height);
          
          if (tmp_width >= 6*7 && tmp_height >= 12*3 ){
            this.ctx.fillStyle = "rgb(50,50,50)";
            this.ctx.textAlign = "left";
            this.ctx.fillText( "x="+chunk_x*16,tmp_x+tmp_width/2-21,tmp_y+tmp_height/2-6);
            this.ctx.fillText( "z="+chunk_y*16,tmp_x+tmp_width/2-21,tmp_y+tmp_height/2+6);
          }
        }
        // in progress
        // if (cell_width >= 4&&cell_height >= 4)
        // if (chunk_x%4==0&&chunk_y%4==0) this.ctx.drawImage( this.getchunkImage(chunk_x,chunk_y),tmp_x,tmp_y,cell_width*4,cell_height*4);
      }
    }
  }
  this.getchunkImage = function(chunk_x,chunk_y){
    if (chunk_x%4==0&&chunk_y%4==0){
      if (this.chunkImagecache[chunk_x+500][chunk_y+500]==null
      || this.chunkImagecache[chunk_x+500][chunk_y+500].src=="noimage.png"){
        this.chunkImagecache[chunk_x+500][chunk_y+500] = new Image();
        this.chunkImagecache[chunk_x+500][chunk_y+500].src = "http://$HOST:8123/tiles/world/flat/"
        +Math.floor(chunk_x/4/32)+"_"+Math.floor((-(chunk_y/4)-1)/32)+"/"+(chunk_x/4)+"_"+(-(chunk_y/4)-1)+".png";
      
        this.chunkImagecache[chunk_x+500][chunk_y+500].onerror = function(){
          this.src=this.src
          this.onerror = function(){
            this.src="noimage.png"
          };
        
        };
      }
      return this.chunkImagecache[chunk_x+500][chunk_y+500]
    }
  }
  this.getImage = function(a){
    var url = this.canvas.toDataURL()
    $(a).attr("href",url);
  }
  
  this.printCell = function(zoom){
        
        //map背景
     this.ctx.fillStyle = 'rgb(200,255,250)';
    this.ctx.fillRect(40,80,480,480);  
      
      
    var row = ~~this.width/zoom;
    var line = ~~this.width/zoom;
      
    this.ctx.strokeStyle = 'rgb(150,150,150)';
    
    
    
    var cell_width = zoom;
    var cell_height = zoom;
    var pad_x = this.padding_x + this.width%(cell_width*2)/2    - ((this.x%16)/16*cell_width  +cell_width)%cell_width;
    var pad_y = this.padding_y + this.height%(cell_height*2)/2    - ((this.y%16)/16*cell_height  +cell_width)%cell_width;
    for(var i =0;i<=row;i++){
      if ( pad_x+i*cell_width >= this.padding_x && pad_x+(i+1)*cell_width <= this.padding_x + this.width){
        var chunk_x = Math.floor(this.x/16) + i - Math.floor(row/2);
        
        if ( chunk_x%Math.ceil(36/cell_width)==0 ){
          this.ctx.fillStyle = 'rgb(50,50,50)';
          this.ctx.font = '12px Myriad';
          this.ctx.textAlign = "left";
          this.ctx.fillText( (Math.floor(this.x/16) + i - Math.floor(row/2))*16,pad_x+i*cell_width,80);
        }
        this.ctx.beginPath();
        this.ctx.moveTo(pad_x+i*cell_width, this.padding_y);
        this.ctx.lineTo(pad_x+i*cell_width, this.padding_y+this.width-1);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(pad_x+(i+1)*cell_width-1, this.padding_y);
        this.ctx.lineTo(pad_x+(i+1)*cell_width-1, this.padding_y+this.width-1);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
    for(var j =0;j<=line;j++){
      if ( pad_y+j*cell_height >=this.padding_y && pad_y+(j+1)*cell_height <= this.padding_y + this.height){
        var chunk_y = Math.floor(this.y/16) + j - Math.floor(line/2);
        
        if ( chunk_y%Math.ceil(36/cell_height)==0 ){
          this.ctx.fillStyle = 'rgb(50,50,50)';
          this.ctx.font = '12px Myriad';
          this.ctx.textAlign = "right";
          this.ctx.fillText( chunk_y*16,40,pad_y+j*cell_height);
        }
          
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding_x+0 ,pad_y+j*cell_height);
        this.ctx.lineTo(this.padding_x+this.width-1,pad_y+j*cell_height);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding_x+0 ,pad_y+(j+1)*cell_height-1);
        this.ctx.lineTo(this.padding_x+this.width-1,pad_y+(j+1)*cell_height-1);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  }
  this.getLinkUrl = function(){
    location.href = ""+ location.origin + "" + location.pathname + "?seed="+this.seed+"&zoom="+this.zoom+"&x="+(~~this.x)+"&z="+(~~this.y)+"&";
  }
}
