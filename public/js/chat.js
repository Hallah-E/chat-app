const socket= io() 

//Note: socket sends the event to that specific socket connection

//Elements
const $messageForm= document.querySelector('#message-form')
const $messageFormInput= $messageForm.querySelector('input')
const $messageFormButton= $messageForm.querySelector('button')
const $sendlocationButton= document.querySelector('#send-location')
const $messages= document.querySelector('#messages')

//Templates
const messageTemplate= document.querySelector('#message-template').innerHTML
const locationMessageTemplate= document.querySelector('#location-message-template').innerHTML
const sidebarTemplate= document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll= ()=>{
    //New message element
    const $newMessage= $messages.lastElementChild
    
    //Hieght of the new message
    const newMessageStyles= getComputedStyle($newMessage)
    const newMessageMargin= parseInt(newMessageStyles.marginBottom)
    const newMessageHeight= $newMessage.offsetHeight + newMessageMargin
    
    //Visible height
    const visibleHeight= $messages.offsetHeight

    //Height of messages container
    const containerHeight= $messages.scrollHeight

    //How far I have scrolled? 
    const scrollOffset= $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop= $messages.scrollHeight
    }
    
}

socket.on('message',(message)=>{
    console.log(message)
    const html= Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    console.log(message)
    const html= Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html= Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML= html
})

$messageForm.addEventListener('submit', (e)=>{

    e.preventDefault() 
    //Previosly: const message= document.querySelector('input').value

    $messageFormButton.setAttribute('disabled', 'disabled') // disable the button
    const message= e.target.elements.message.value

    socket.emit('sendMessage', message,(error)=>{
        $messageFormButton.removeAttribute('disabled') //enable the button
        $messageFormInput.value= ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message was delivered ', message)
    })
})

$sendlocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    
    $sendlocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            console.log('Location shared!')
            $sendlocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href= '/'
    }
})

