// Store frame for motion functions
    var previousFrame = null;
    var paused = true;
    var option = "right";
    var pauseOnGesture = false;
    var gesture_name = "";
    // Hand position values.
    var hand_palm = [0, 0, 0];
    var ellipses = [];
    var lines = [];
    var proximal_phalanxs = [];
    // Canvas
    var canvas_width = 500;
    var canvas_height = 500;
    // Decision tree
    var decision_trees = [];
    var decision_tree_index = 0;
    // Decision tree data
    var hand_data = [];
    var palm_position = {};
    var predictions = [];
    // Setup Leap loop with frame callback function
    var controllerOptions = {};
    var hand_position_image_b64 = undefined;
    // to use HMD mode:
    controllerOptions.optimizeHMD = true;

    Function.prototype.toJSON = function() {
        console.log("Serialization!!!");
          var parts = this
              .toString()
              .match(/^\s*function[^(]*\(([^)]*)\)\s*{(.*)}\s*$/)
          ;
          if (parts == null)
              throw 'Function form not supported';

          return [
              'window.Function',
              parts[1].trim().split(/\s*,\s*/),
              parts[2]
          ];
        };

    Leap.loop(controllerOptions, function(frame) {
        if (paused) {
            return; // Skip this update
        }

        if (frame.hands.length > 0) {
            for (var i = 0; i < frame.hands.length; i++) {
                var hand = frame.hands[i];

                hand_palm = vectorToArray(hand.palmPosition);
                palm_position[hand.id] = hand_palm;
            }
        }

        if (frame.pointables.length > 0) {
            if (option == "Test" && frame.id % 2 != 0) return;
            var fingerTypeMap = ["Thumb", "Index finger", "Middle finger", "Ring finger", "Pinky finger"];
            var boneTypeMap = ["Metacarpal", "Proximal phalanx", "Intermediate phalanx", "Distal phalanx"];
            var fingers_dist = {};
            fingers_dist["n_extended_fingers"] = 0;
            for (var i = 0; i < frame.pointables.length; i++) {
                var pointable = frame.pointables[i];

                pointable.bones.forEach( function(bone){
                    if (boneTypeMap[bone.type] != "Metacarpal") {
                        var bone_position = vectorToArray(bone.center());
                        if (boneTypeMap[bone.type] != "Proximal phalanx") {
                            lines.push([ellipses[ellipses.length-1], bone_position]);
                        }
                        if (boneTypeMap[bone.type] == "Proximal phalanx")
                            proximal_phalanxs.push(bone_position);
                        ellipses.push(bone_position);
                    }
                });
                if (i == 0) continue;
                var curr_finger = vectorToArray(pointable.tipPosition);
                var prev_finger = vectorToArray(frame.pointables[i-1].tipPosition);
                fingers_dist["adj_fingers_dist"+i] = Math.sqrt((prev_finger[0]-curr_finger[0])**2 +
                                                               (prev_finger[1]-curr_finger[1])**2 +
                                                               (prev_finger[2]-curr_finger[2])**2);
                //var vector1mag = Math.sqrt((palm_position[pointable.handId][0]-curr_finger[0])**2 +
                //                           (palm_position[pointable.handId][1]-curr_finger[1])**2 +
                //                           (palm_position[pointable.handId][2]-curr_finger[2])**2);
                //var vector2mag = Math.sqrt((palm_position[pointable.handId][0]-prev_finger[0])**2 +
                //                           (palm_position[pointable.handId][1]-prev_finger[1])**2 +
                //                           (palm_position[pointable.handId][2]-prev_finger[2])**2);
                //var vector1norm = [(palm_position[pointable.handId][0]-curr_finger[0])/vector1mag,
                //                   (palm_position[pointable.handId][1]-curr_finger[1])/vector1mag,
                //                   (palm_position[pointable.handId][2]-curr_finger[2])/vector1mag];

                //var vector2norm = [(palm_position[pointable.handId][0]-prev_finger[0])/vector2mag,
                //                   (palm_position[pointable.handId][1]-prev_finger[1])/vector2mag,
                //                   (palm_position[pointable.handId][2]-prev_finger[2])/vector2mag];
                //var angle = Math.acos(vector1norm[0]*vector2norm[0] + vector1norm[1]*vector2norm[1] + vector1norm[2]*vector2norm[2]);
                //fingers_dist["adj_fingers_angle"+i] = angle;
                fingers_dist["n_extended_fingers"] += (pointable.extended ? 1 : 0);
            }
            if (option == "Test") {
                prediction = (decision_trees[decision_tree_index-1].predict(fingers_dist) == 1 ? gesture_name : "None");
                predictions.push(prediction);
                if (predictions.length == 3) {
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

                    if (max_value == "None")
                    {
                        // get data
                        var height = document.getElementById("gestureImg").style.height;
                        var width = document.getElementById("gestureImg").style.width;

                        //update size and color of the layer
                        document.getElementById("gestureColorLayer").style.height = height + 'px';
                        document.getElementById("gestureColorLayer").style.width = width + 'px';
                        document.getElementById("gestureColorLayer").style.backgroundColor = 'rgba(255, 51, 51, 0.1)';
                        document.getElementById("gestureColorLayer").style.borderStyle = 'solid';
                        document.getElementById("gestureColorLayer").style.borderWidth = '5px';
                        document.getElementById("gestureColorLayer").style.borderColor = '#b30000';

                        document.getElementById("labelTestGesture").value = "Incorrect"
                    }
                    else
                    {
                        // get data
                        var height = document.getElementById("gestureImg").style.height;
                        var width = document.getElementById("gestureImg").style.width;

                        //update size and color of the layer
                        document.getElementById("gestureColorLayer").style.height = height + 'px';
                        document.getElementById("gestureColorLayer").style.width = width + 'px';
                        document.getElementById("gestureColorLayer").style.backgroundColor = 'rgba(135, 211, 124, 0.1)';
                        document.getElementById("gestureColorLayer").style.borderStyle = 'solid';
                        document.getElementById("gestureColorLayer").style.borderWidth = '5px';
                        document.getElementById("gestureColorLayer").style.borderColor = '#008000';

                        document.getElementById("labelTestGesture").value = "Correct"

                    }
                    //document.getElementById("gesture_name").innerHTML = max_value;
                    predictions = [];
                }
            }
            else {
                fingers_dist["classification"] = (option == "Right" ? 1 : 0);
                hand_data.push(fingers_dist);
            }
            //var flag = false;
            //for (var i = 0; i < hand_data.length; i++) {
            //    if (JSON.stringify(hand_data[i]) == JSON.stringify(fingers_dist)) {
            //        flag = true;
            //        break;
            //    }
            //}
            //if (!flag)
            console.log(frame.id);
        }

        // Store frame for motion functions
        previousFrame = frame;
    })

    function vectorToArray(vector, digits) {
        if (typeof digits === "undefined") {
            digits = 1;
        }
        return [vector[0].toFixed(digits),
                vector[1].toFixed(digits),
                vector[2].toFixed(digits)];
    }


    function pauseForGestures() {
        if (document.getElementById("pauseOnGesture").checked) {
            pauseOnGesture = true;
        } else {
            pauseOnGesture = false;
        }
    }

    function stopTesting() {
        document.getElementById("labelTestGesture").value = ""

        // get data
        var height = document.getElementById("gestureImg").style.height;
        var width = document.getElementById("gestureImg").style.width;

        //update size and color of the layer
        document.getElementById("gestureColorLayer").style.height = height + 'px';
        document.getElementById("gestureColorLayer").style.width = width + 'px';
        document.getElementById("gestureColorLayer").style.backgroundColor = 'rgba(0, 0, 0, 0)';
        document.getElementById("gestureColorLayer").style.borderStyle = 'solid';
        document.getElementById("gestureColorLayer").style.borderWidth = '0px';

        paused = true;
    }

    function setup() {
        var canvas = createCanvas(400, 400);
        canvas.parent("canvas_div");
        angleMode(DEGREES);
    }

    var frame_count = 0;
    function draw() {
        background("#F0F0F0");
        //if (frame_count % 5 != 0)
        //    return;
        frame_count = 0;
        stroke("#1a57a5");
        fill("#1a57a5");
        //strokeWeight(1);
        //ellipse(int(hand_palm[0])+(canvas_width/2), int(hand_palm[2])+(canvas_height/1.5), 50);
        strokeWeight(5);
        for (var l = 0; l < ellipses.length; l++) {
            if (typeof lines[l] == "undefined") continue;
            line(int(lines[l][0][0])*2+(canvas_width/2), int(lines[l][0][2])*2+(canvas_height/1.5),
                 int(lines[l][1][0])*2+(canvas_width/2), int(lines[l][1][2])*2+(canvas_height/1.5));
        }
        for (var p = 1; p < ellipses.length; p++) {
            if (typeof proximal_phalanxs[p] == "undefined") continue;
            line(int(proximal_phalanxs[p][0])*2+(canvas_width/2), int(proximal_phalanxs[p][2])*2+(canvas_height/1.5),
                 int(proximal_phalanxs[p-1][0])*2+(canvas_width/2), int(proximal_phalanxs[p-1][2])*2+(canvas_height/1.5));
        }
        if (typeof proximal_phalanxs[proximal_phalanxs.length-1] != "undefined" && typeof proximal_phalanxs[0] != "undefined") {
            strokeWeight(5);
            line(int(proximal_phalanxs[proximal_phalanxs.length-1][0])*2+(canvas_width/2), int(proximal_phalanxs[proximal_phalanxs.length-1][2])*2+(canvas_height/1.5),
                 int(proximal_phalanxs[proximal_phalanxs.length-1][0])*2+(canvas_width/2), int(proximal_phalanxs[0][2])*2+(canvas_height/1.5));
            line(int(proximal_phalanxs[0][0])*2+(canvas_width/2), int(proximal_phalanxs[0][2])*2+(canvas_height/1.5),
                 int(proximal_phalanxs[proximal_phalanxs.length-1][0])*2+(canvas_width/2), int(proximal_phalanxs[0][2])*2+(canvas_height/1.5));
            strokeWeight(1);
            stroke("#000000");
            fill("#ffffff");
            ellipse(int(proximal_phalanxs[proximal_phalanxs.length-1][0])*2+(canvas_width/2), int(proximal_phalanxs[0][2])*2+(canvas_height/1.5), 15);
        }
        strokeWeight(1);
        stroke("#000000");
        fill("#ffffff");
        for (var e = 0; e < ellipses.length; e++) {
            ellipse(int(ellipses[e][0])*2+(canvas_width/2), int(ellipses[e][2])*2+(canvas_height/1.5), 15);
        }
        ellipses = [];
        lines = [];
        proximal_phalanxs = [];
    }

    function toggleRightGesture() {
        paused = !paused;
        option = "Right";

        if (paused) {
            document.getElementById("start1").innerText = "Resume Right Gesture";
        } else {
            document.getElementById("start1").innerText = "Pause Right Gesture";
        }
    }

    function toggleRandomGesture() {
        paused = !paused;
        option = "Random";

        if (paused) {
            document.getElementById("start2").innerText = "Resume Random Gesture";

        } else {
            document.getElementById("start2").innerText = "Pause Random Gesture";
        }
    }

    function addGesture() {
        $("#recognition_content").css("visibility", "visible");
        gesture_name = $("#gesture_name_input").val();
        //document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
        //                                                   'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        //option = "Right";
        //paused = false; // Start collecting images.
        //var timer = setInterval(function() {
        //    if (hand_data.length >= 1000) {
        //        paused = true; // Stop collecting images.
        //        hand_data = hand_data.slice(0, 1000);
        //        clearInterval(timer);
        //        option = "Random";
        //        paused = false; // Start collecting images.
        //        var timer2 = setInterval(function() {
        //            if (hand_data.length >= 2000) {
        //                paused = true; // Stop collecting images.
        //                hand_data = hand_data.slice(0, 2000);
        //                clearInterval(timer2);
        //                trainAndTestDT();
        //            }
        //            var percentage = (hand_data.length - 1000) / 10;
        //            document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active"'+
        //                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">'+
        //                                                               100+'%</div></div>'+
        //                                                               '<div class="progress" style="width: 20%"><div class="progress-bar bg-danger progress-bar-striped active"'+
        //                                                               'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+
        //                                                               percentage+'%</div></div>'
        //        }, 100);
        //    }
        //    var percentage = hand_data.length / 5;
        //    document.getElementById("status_bars").innerHTML = '<div class="progress" style="width: 20%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
        //                                                       'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+percentage+'%</div></div>'
        //}, 100);
    }

    function trainAndTestDT() {
        // Shuffle hand_data array.
        var j, x, i;
        for (i = hand_data.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = hand_data[i];
            hand_data[i] = hand_data[j];
            hand_data[j] = x;
        }
        console.log(hand_data);
        // Create training and testing sets.
        var training_set = hand_data.slice(0, Math.round(hand_data.length*0.8));
        var testing_set  = hand_data.slice(Math.round(hand_data.length*0.8), hand_data.length);
        var config = {trainingSet: training_set, categoryAttr: "classification"};
        decision_trees[decision_tree_index] = new dt.DecisionTree(config);
        decision_trees[decision_tree_index].gesture_name = $("id_name").val();
        var counter = 0;
        for (var i = 0; i < testing_set.length; i++) {
            var test_case = JSON.parse(JSON.stringify(testing_set[i]));
            delete test_case.classification;
            if (decision_trees[decision_tree_index].predict(test_case) == testing_set[i].classification)
                counter += 1;
        }
        console.log("PRECISION: "+(counter / testing_set.length)*100);
        decision_tree_index += 1;
        hand_data = []
    }

    function testGesture() {
        option = "Test";
        paused = false;
    }

    function collectRightGestures() {
        console.log("HAND: "+hand_position_image_b64);
        document.getElementById("right_status_bars").innerHTML = '&nbsp<p>Collecting Right Gestures...</p><div class="progress" style="width:100%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        option = "Right";
        paused = false; // Start collecting images.

        var timer = setInterval(function() {
            if (hand_data.length >= 500) {
                paused = true; // Stop collecting images.
                hand_data = hand_data.slice(0, 500);
                clearInterval(timer);
                document.getElementById("right_status_bars").innerHTML = '&nbsp<p>Finished...</p><div class="progress" style="width: 100%"><div class="progress-bar bg-success progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">100%</div></div>'
                console.log(hand_data)

                document.getElementById("random_gesture_btn").disabled = false;
                document.getElementById("right_gesture_btn").disabled = true;
            }
            else {

                var percentage = hand_data.length / 5;
                var correct_rgb = {'r':239, 'g':239, 'b':239};

                 var blockSize = 5, // only visit every 5 pixels
                    context = canvas.getContext && canvas.getContext('2d'),
                    data, width, height,
                    i = -4,
                    length,
                    rgb = {r:0,g:0,b:0},
                    count = 0;


                height = canvas.height;
                width = canvas.width;


                data = context.getImageData(0, 0, width, height);


                length = data.data.length;

                while ( (i += blockSize * 4) < length ) {
                    ++count;
                    rgb.r += data.data[i];
                    rgb.g += data.data[i+1];
                    rgb.b += data.data[i+2];
                }

                // ~~ used to floor values
                rgb.r = ~~(rgb.r/count);
                rgb.g = ~~(rgb.g/count);
                rgb.b = ~~(rgb.b/count);


                if (hand_position_image_b64 === undefined && percentage >= 50 && percentage <= 90 && !((rgb.r==239 && rgb.g==239 && rgb.b==239) || (rgb.r==240 && rgb.g==240 && rgb.b==240)) )
                {
                    hand_position_image_b64 = canvas.toDataURL("image/jpeg");
                }

                document.getElementById("right_status_bars").innerHTML = '&nbsp<p>Collecting Right Gestures...</p><div class="progress" style="width: 100%"><div class="progress-bar bg-success progress-bar-striped active" ' +
                    'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:' + percentage + '%">' +
                    percentage + '%</div></div>'
            }
        }, 100);

    }

    function collectRandomGestures() {
        document.getElementById("random_status_bars").innerHTML = '&nbsp<p>Collecting Random Gestures...</p><div class="progress" style="width: 100%"><div class="progress-bar bg-danger progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div>'
        option = "Random";
        paused = false; // Start collecting images.

        var timer2 = setInterval(function() {
            if (hand_data.length >= 1000) {
                paused = true; // Stop collecting images.
                clearInterval(timer2);
                document.getElementById("random_status_bars").innerHTML = '&nbsp<p>Finished...</p><div class="progress" style="width: 100%"><div class="progress-bar bg-danger progress-bar-striped active" role="progressbar"'+
                                                           'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:100%">100%</div></div>'
                trainAndTestDT();

                document.getElementById("random_gesture_btn").disabled = true;
                document.getElementById("confirmGesture").disabled = false;
                document.getElementById("testGestureBtn").disabled = false;
                document.getElementById("stopTestGesture").disabled = false;

            }else {
                var percentage = (hand_data.length - 500) / 5;
                document.getElementById("random_status_bars").innerHTML = '&nbsp<p>Collecting Random Gestures...</p><div class="progress" style="width: 100%"><div class="progress-bar bg-danger progress-bar-striped active" ' +
                    'role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:' + percentage + '%">' +
                    percentage + '%</div></div>'
            }
        }, 100);
    }