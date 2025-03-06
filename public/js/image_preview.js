let inputElement=document.querySelector('#image_upload input');
let imgElement=document.querySelector('#image_upload img');
function updatepreview(){
    let files=inputElement.files
    if(!files||files.length==0){
        imgElement.style.display='none';
        return;
    }
    let pickedfile=files[0];
   imgElement.src= URL.createObjectURL(pickedfile);
   imgElement.style.display='block';
   
}
inputElement.addEventListener('change', updatepreview);
