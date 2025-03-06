let menu=document.querySelector('.menu');
let list=document.querySelector('.list');
function changedisplay(){
   list.classList.toggle('open');
}
menu.addEventListener('click',changedisplay);
// for  the video 
let video_speed=document.querySelector('.video')
if(video_speed){
   video_speed.playbackRate=0.6;   
}
