var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var huejay = require("huejay");
var port = process.env.PORT || 3000;
let client = new huejay.Client({
  host:     'IP ADDRESS',
  username: "SECRET KEY"
});
var arrayOfColors = [];
var timer;

huejay.discover()
  .then(bridges => {
    for (let bridge of bridges) {
      console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
    }
  })
  .catch(error => {
    console.log(`An error occurred: ${error.message}`);
  });

client.bridge.get()
  .then(bridges => {
    console.log(`Retrieved bridge ${bridge.name}`);
    console.log('  Id:', bridges.id);
    console.log('  Model Id:', bridges.modelId);
    console.log('  Model Name:', bridges.model.name);
  })
  .catch(error => {
  	console.log("Could not bridge");
  });

client.bridge.ping()
  .then(() => {
    console.log('Successful connection');
  })
  .catch(error => {
    console.log('Could not connect');
  });

client.bridge.isAuthenticated()
  .then(() => {
    console.log('Successful authentication');
  })
  .catch(error => {
    console.log('Could not authenticate');
  });

// var group = new client.groups.Group;
// group.name     = 'New group';
// group.lightIds = [1,2,3];

// client.groups.create(group)
// 	.then(group => {
// 		console.log(`Group [${group.id}] created`);
// 	})
// 	.catch(error => {
// 	console.log(error.stack);
// });

io.on('connection', function(socket){
	// Turn on and Off the light bulbs from the ui.
  	socket.on("On/Off", function(){
		client.groups.getById(1)
		  	.then(group => {
		  		if(group.on === true)
		    		group.on = false;
		    	else
		    		group.on = true;
			    return client.groups.save(group);
		  	})
		  	.then(group => {
		    	console.log(`Group [${group.id}] was saved`);
		  	})
		  	.catch(error => {
		    	console.log(error.stack);
		  	});
  	});

	socket.on("Add to Queue", function(color) {
		arrayOfColors.push(color);
		if(arrayOfColors.length == 1)
			timer = setInterval(function(){ nextColor() }, 5000);
		io.sockets.emit("Update Queue List", color);
	});

	function nextColor() {
		changeAllColors(arrayOfColors[0]);
		io.sockets.emit("Delete Item in Queue List");
		arrayOfColors.shift();
		if(arrayOfColors.length == 0)
			clearInterval(timer);

	}
	
	function changeAllColors(color) {
		client.groups.getById(1)
		  	.then(group => {
		    	group.on = true;
		    	group.colormode = "xy";
		   		group.xy = color;
			    return client.groups.save(group);
		  	})
		  	.then(group => {
		    	console.log(`Group [${group.id}] was saved`);
		  	})
		  	.catch(error => {
		    	console.log(error.stack);
		  	});
	}

	//Code to change singular light bulbs
	socket.on('change color', function(color){
  		changeColor(color);
	});

	function changeColor(color) {
		client.lights.getById(3)
		  .then(light => {
		  	light.colormode = "xy";
		   	light.xy = color;
		    return client.lights.save(light);
		  })
		  .then(light => {
		    console.log(`Updated light [${light.id}]`);
		  })
		  .catch(error => {
		    console.log('Something went wrong');
		    console.log(error.stack);
		  });
	}
});

app.use(express.static(__dirname + '/public'));

function send404Response(response) {
    response.writeHead(404, {
        "Content-Type": "text/plain"
    });
    response.write("Error 404: Page not found!");
    response.end();
};

http.listen(port, function(){
  console.log('listening on *:' + port);
});