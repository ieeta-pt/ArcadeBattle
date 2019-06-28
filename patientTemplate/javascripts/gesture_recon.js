/*

var Singleton = (function () {
    var instance;
 
    function createInstance() {
        var object = new WebSocket("ws://localhost:8081");
        return object;
    }
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

*/

function GestureRecon(decision_trees, draw_p5js) {
    // Store frame for motion functions
    this.previousFrame = null;
    this.draw_p5js = typeof(a)==='undefined' ? false : draw_p5js;
    this.paused = true;
    this.option = "right";
    this.pauseOnGesture = false;
    this.gesture_name = "";
    this.hand_palm = [0, 0, 0];
    this.ellipses = [];
    this.lines = [];
    this.proximal_phalanxs = [];
    this.canvas_width = 500;
    this.canvas_height = 500;
    this.decision_trees = decision_trees;
    for (var i = 0; i < this.decision_trees.length; i++){
        console.log(this.decision_trees[i])
        this.decision_trees[i] = new dt.DecisionTree(json_to_decision_tree(JSON.parse(this.decision_trees[i])), true);
    }
    this.decision_trees[0].gesture_name = localStorage.getItem("gesture_name");
    this.decision_trees[1].gesture_name = "open_hand";
    this.decision_tree_index = 0;
    this.hand_data = [];
    this.predictions = [];
    this.controllerOptions = {};
    this.controllerOptions.optimizeHMD = true;
    this.websocket = undefined; 

    function json_to_decision_tree(json) {
        if (json.predict != undefined)
            json.predict = deserialise_json(json.predict);
         if (json.category != undefined)
             return json;
         if (json.predicate != undefined)
             json.predicate = deserialise_json(json.predicate);
         if (json.root != undefined)
             json.root = json_to_decision_tree(json.root);
         else {
             if (json.match != undefined)
                 json.match = json_to_decision_tree(json.match);
             if (json.match != undefined)
                 json.notMatch = json_to_decision_tree(json.notMatch);
         }
         return json;
    }
 
     function deserialise_json(data) {
         if (data == null)
          return null;
        if (data instanceof String || typeof data == 'string')
            data = JSON.parse(data);
        return new (Function.bind.apply(Function, [Function].concat(data.splice(1, 3))));
     }

    
    function vectorToArray(vector, digits) {
        if (typeof digits === "undefined") {
            digits = 1;
        }
        return [vector[0].toFixed(digits),
                vector[1].toFixed(digits),
                vector[2].toFixed(digits)];
    }


    function pauseForGestures() {
        if (document.getElementById("this.pauseOnGesture").checked) {
            this.pauseOnGesture = true;
        } else {
            this.pauseOnGesture = false;
        }
    }

    this.start = function() {
        this.websocket = new WebSocket("ws://localhost:8080");
        this.paused = false;
        this.is_hand_open = false;
        this.gesture_done = false;
        this.gesture_time = undefined;
        this.option = "websockets";
        var option = this.option;
        var decision_trees = this.decision_trees;
        var predictions = this.predictions;
        var websocket = this.websocket;
        this.palm_position = {};
        Leap.loop(this.controllerOptions, function(frame) {
            if (this.paused) {
                return;
            }

            //console.log(websocket.readyState);
            //if (websocket.readyState == 3)
            //    websocket = new WebSocket("ws://localhost:8080");

            //if (frame.hands.length > 0) {
            //    for (var i = 0; i < frame.hands.length; i++) {
            //        var hand = frame.hands[i];
            //        
            //        this.hand_palm = vectorToArray(hand.palmPosition);
            //        this.palm_position[hand.id] = this.hand_palm;
            //    }
            //}

            if (frame.pointables.length > 0) {
                if (this.option == "Test" && frame.id % 2 != 0) return;
                var fingerTypeMap = ["Thumb", "Index finger", "Middle finger", "Ring finger", "Pinky finger"];
                var boneTypeMap = ["Metacarpal", "Proximal phalanx", "Intermediate phalanx", "Distal phalanx"];
                var fingers_dist = {};
                fingers_dist["n_extended_fingers"] = 0;
                for (var i = 0; i < frame.pointables.length; i++) {
                    var pointable = frame.pointables[i];

                    pointable.bones.forEach( function(bone){
                        if (boneTypeMap[bone.type] != "Metacarpal") {
                            var bone_position = vectorToArray(bone.center());
                            //if (boneTypeMap[bone.type] != "Proximal phalanx") {
                            //    this.lines.push([this.ellipses[this.ellipses.length-1], bone_position]);
                            //}
                            //if (boneTypeMap[bone.type] == "Proximal phalanx")
                            //    this.proximal_phalanxs.push(bone_position);
                            //this.ellipses.push(bone_position);
                        }
                    });
                    if (i == 0) continue;
                    var curr_finger = vectorToArray(pointable.tipPosition);
                    var prev_finger = vectorToArray(frame.pointables[i-1].tipPosition);
                    fingers_dist["adj_fingers_dist"+i] = Math.sqrt((prev_finger[0]-curr_finger[0])**2 + 
                                                                   (prev_finger[1]-curr_finger[1])**2 + 
                                                                   (prev_finger[2]-curr_finger[2])**2);
                    fingers_dist["n_extended_fingers"] += (pointable.extended ? 1 : 0);
                }
                if (this.option == "Test") {
                    prediction = (this.decision_trees[this.decision_tree_index-1].predict(fingers_dist) == 1 ? this.gesture_name : "None");
                    this.predictions.push(prediction);
                    if (this.predictions.length == 3) {
                        counters = {};
                        for (var pred = 0; pred < this.predictions.length; pred++) {
                            if (this.predictions[pred] in counters)
                                counters[this.predictions[pred]] += 1;
                            else
                                counters[this.predictions[pred]] = 0;
                        }
                        var max_value = this.predictions[0];
                        for (var key in counters) {
                            if (counters[key]  > counters[max_value])
                                max_value = key;
                        }
                        document.getElementById("this.gesture_name").innerHTML = max_value;
                        this.predictions = [];
                    }
                }
                else if (option == "websockets") {
                    prediction = undefined;
                    for (var i = 0; i < decision_trees.length; i++)
                        if (decision_trees[i].predict(fingers_dist) == 1) {
                            console.log("GESTURENAME: "+decision_trees[i].gesture_name)
                            prediction = decision_trees[i].gesture_name;
                            break;
                        }
                    predictions.push(prediction);
                    if (predictions.length == 5) {
                        counters = {};
                        for (var pred = 0; pred < predictions.length; pred++) {
                            if (predictions[pred] in counters)
                                counters[predictions[pred]] += 1;
                            else
                                counters[predictions[pred]] = 0;
                        }
                        var max_value = predictions[0];
                        for (var key in counters) {
                            if (counters[key]  > counters[max_value])
                                max_value = key;
                        }
                        try {
                            if (max_value == "open_hand") {
                                if (this.is_hand_open == false && !this.gesture_done) {
                                    console.log("MISS!!!!!!");
                                    localStorage.setItem("failedGestures", Number(localStorage.getItem("failedGestures"))+1);
                                }
                                this.is_hand_open = true;
                                this.gesture_done = false;
                            }
                            else {
                                if (this.gesture_done == false && max_value == localStorage.getItem("gesture_name")){//("" + JSON.parse(localStorage.getItem("gesture_tree")).gesture_name)) {
                                    localStorage.setItem("rightGestures", Number(localStorage.getItem("rightGestures"))+1);
                                    websocket.send('{"gesture_recognized": "action"}');
                                    this.gesture_done = true;
                                    console.log("time : " + ((new Date()).getTime() - this.gesture_time));
                                    this.gesture_time = undefined;
                                }
                                if (this.gesture_time == undefined)
                                    this.gesture_time = (new Date()).getTime();
                                this.is_hand_open = false;
                            }

                        } catch(e) {console.log(e)}
                        //document.getElementById("this.gesture_name").innerHTML = max_value;
                        predictions = [];
                    }
                }
                //else {
                //    fingers_dist["classification"] = (this.option == "Right" ? 1 : 0);
                //    this.hand_data.push(fingers_dist); 
                //}
                //var flag = false;
                //for (var i = 0; i < this.hand_data.length; i++) {
                //    if (JSON.stringify(this.hand_data[i]) == JSON.stringify(fingers_dist)) {
                //        flag = true;
                //        break;
                //    }
                //}
                //if (!flag)
            }
            // Store frame for motion functions
            this.previousFrame = frame;
        })

    }

    this.stop = function() {
        this.paused = true;
        this.websocket.close();

    function setup() {
        var canvas = createCanvas(400, 400);
        canvas.parent("canvas_div");
        angleMode(DEGREES);
    }

    var frame_count = 0;
    function draw() {
        // Dont draw.
        if (!this.draw_p5js) return;
        // Draw
        background("#d6e6f2");
        if (frame_count % 5 != 0)
            return;
        frame_count = 0;
        stroke("#1a57a5");
        fill("#1a57a5");
        //strokeWeight(1);
        //ellipse(int(this.hand_palm[0])+(this.canvas_width/2), int(this.hand_palm[2])+(this.canvas_height/1.5), 50);
        strokeWeight(5);
        for (var l = 0; l < this.ellipses.length; l++) {
            if (typeof this.lines[l] == "undefined") continue;
            line(int(this.lines[l][0][0])*2+(this.canvas_width/2), int(this.lines[l][0][2])*2+(this.canvas_height/1.5),
                 int(this.lines[l][1][0])*2+(this.canvas_width/2), int(this.lines[l][1][2])*2+(this.canvas_height/1.5));
        }
        for (var p = 1; p < this.ellipses.length; p++) {
            if (typeof this.proximal_phalanxs[p] == "undefined") continue;
            line(int(this.proximal_phalanxs[p][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[p][2])*2+(this.canvas_height/1.5),
                 int(this.proximal_phalanxs[p-1][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[p-1][2])*2+(this.canvas_height/1.5));
        }
        if (typeof this.proximal_phalanxs[this.proximal_phalanxs.length-1] != "undefined" && typeof this.proximal_phalanxs[0] != "undefined") {
            strokeWeight(5);
            line(int(this.proximal_phalanxs[this.proximal_phalanxs.length-1][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[this.proximal_phalanxs.length-1][2])*2+(this.canvas_height/1.5),
                 int(this.proximal_phalanxs[this.proximal_phalanxs.length-1][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[0][2])*2+(this.canvas_height/1.5));
            line(int(this.proximal_phalanxs[0][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[0][2])*2+(this.canvas_height/1.5),
                 int(this.proximal_phalanxs[this.proximal_phalanxs.length-1][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[0][2])*2+(this.canvas_height/1.5));
            strokeWeight(1);
            stroke("#000000");
            fill("#ffffff");
            ellipse(int(this.proximal_phalanxs[this.proximal_phalanxs.length-1][0])*2+(this.canvas_width/2), int(this.proximal_phalanxs[0][2])*2+(this.canvas_height/1.5), 15);
        }
        strokeWeight(1);
        stroke("#000000");
        fill("#ffffff");
        for (var e = 0; e < this.ellipses.length; e++) {
            ellipse(int(this.ellipses[e][0])*2+(this.canvas_width/2), int(this.ellipses[e][2])*2+(this.canvas_height/1.5), 15);
        }
        this.ellipses = [];
        this.lines = [];
        this.proximal_phalanxs = [];
    }

    function toggleRightGesture() {
        this.paused = !this.paused;
        this.option = "Right";

        if (this.paused) {
            document.getElementById("start1").innerText = "Resume Right Gesture";
        } else {
            document.getElementById("start1").innerText = "Pause Right Gesture";
        }
    }

    function toggleRandomGesture() {
        this.paused = !this.paused;
        this.option = "Random";

        if (this.paused) {
            document.getElementById("start2").innerText = "Resume Random Gesture";
        
        } else {
            document.getElementById("start2").innerText = "Pause Random Gesture";
        }
    }

    function addGesture() {
        //$("#recognition_content").css("visibility", "visible");
        //this.gesture_name = $("#this.gesture_name_input").val();
        //document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
        //                                                   'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        //this.option = "Right";
        //this.paused = false; // Start collecting images.
        //var timer = setInterval(function() {
        //    if (this.hand_data.length >= 1000) {
        //        this.paused = true; // Stop collecting images.
        //        this.hand_data = this.hand_data.slice(0, 1000);
        //        clearInterval(timer);
        //        this.option = "Random";
        //        this.paused = false; // Start collecting images.
        //        var timer2 = setInterval(function() {
        //            if (this.hand_data.length >= 2000) {
        //                this.paused = true; // Stop collecting images.
        //                this.hand_data = this.hand_data.slice(0, 2000);
        //                clearInterval(timer2);
        //                trainAndTestDT(); 
        //            }
        //            var percentage = (this.hand_data.length - 1000) / 10;
        //            document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active"'+
        //                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">'+
        //                                                               100+'%</div></div>'+
        //                                                               '<div class="progress" style="width: 20%"><div class="progress-bar bg-danger progress-bar-striped active"'+
        //                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+
        //                                                               percentage+'%</div></div>'
        //        }, 100);
        //    }
        //    var percentage = this.hand_data.length / 5;
        //    document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
        //                                                       'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+percentage+'%</div></div>'
        //}, 100);
    }

    function trainAndTestDT() {
        // Shuffle this.hand_data array.
        var j, x, i;
        for (i = this.hand_data.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.hand_data[i];
            this.hand_data[i] = this.hand_data[j];
            this.hand_data[j] = x;
        }
        console.log(this.hand_data);
        // Create training and testing sets.
        var training_set = this.hand_data.slice(0, Math.round(this.hand_data.length*0.8));
        var testing_set  = this.hand_data.slice(Math.round(this.hand_data.length*0.8), this.hand_data.length);
        var config = {trainingSet: training_set, categoryAttr: "classification"};
        this.decision_trees[this.decision_tree_index] = new dt.DecisionTree(config);
        this.decision_trees[this.decision_tree_index].this.gesture_name = this.gesture_name;
        var counter = 0;
        for (var i = 0; i < testing_set.length; i++) {
            var test_case = JSON.parse(JSON.stringify(testing_set[i]));
            delete test_case.classification;
            if (this.decision_trees[this.decision_tree_index].predict(test_case) == testing_set[i].classification)
                counter += 1;
        }
        console.log("PRECISION: "+(counter / testing_set.length)*100);
        this.decision_tree_index += 1;
        this.hand_data = []
    }

    function testGesture() {
        var ids = ["right_gesture_btn", "right_status_bars", "random_gesture_btn", "random_status_bars"];
        for (var i = 0; i < ids.length; i++) {
            $("#"+ids[i]).css("visibility", "hidden");
        }
        $("#this.gesture_name").css("visibility", "visible");
        this.option = "Test";
        this.paused = false;
    }

    function collectRightGestures() {
        document.getElementById("right_status_bars").innerHTML = '<p style="margin-left: 20px;">Collecting Right Gestures...</p><div class="progress" style="margin-left: 20px;width:115%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        this.option = "Right";
        this.paused = false; // Start collecting images.
        var timer = setInterval(function() {
            if (this.hand_data.length >= 500) {
                this.paused = true; // Stop collecting images.
                this.hand_data = this.hand_data.slice(0, 500);
                clearInterval(timer);
                document.getElementById("right_status_bars").innerHTML = '<p style="margin-left: 20px;">Finished...</p><div class="progress" style="margin-left: 20px;width: 115%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">100%</div></div>'
            }
            var percentage = this.hand_data.length / 5;
            document.getElementById("right_status_bars").innerHTML = '<p style="margin-left: 20px;">Collecting Right Gestures...</p><div class="progress" style="margin-left: 20px; width: 115%"><div class="progress-bar bg-success progress-bar-striped active" '+
                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+
                                                               percentage+'%</div></div>'
        }, 100);
    }

    function collectRandomGestures() {
        document.getElementById("random_status_bars").innerHTML = '<p>Collecting Random Gestures...</p><div class="progress" style="width: 123%"><div class="progress-bar bg-danger progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        this.option = "Random";
        this.paused = false; // Start collecting images.
        var timer2 = setInterval(function() {
            if (this.hand_data.length >= 1000) {
                this.paused = true; // Stop collecting images.
                this.hand_data = this.hand_data.slice(0, 1000);
                clearInterval(timer2);
                document.getElementById("random_status_bars").innerHTML = '<p>Finished...</p><div class="progress" style="width: 123%"><div class="progress-bar bg-danger progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">100%</div></div>'
                trainAndTestDT(); 
                testGesture();
            }
            var percentage = (this.hand_data.length - 500) / 5;
            document.getElementById("random_status_bars").innerHTML = '<p>Collecting Random Gestures...</p><div class="progress" style="width: 123%"><div class="progress-bar bg-danger progress-bar-striped active" '+
                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+
                                                               percentage+'%</div></div>'
        }, 100);
    }

}}
