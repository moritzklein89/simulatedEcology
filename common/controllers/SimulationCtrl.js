simulatedEcologyApp.controller('simulationCtrl', SimulationCtrl);

function SimulationCtrl($scope, $rootScope, $window, $timeout, $route, $interval, simulationConfig) {

  //THIS CLASS IS A PARTICLE FOR THE GRAPHIC PARTICLE EFFECTS
  //"spawnPoint" is an array that specifies the location in which the particle is created
  //"emitDirection" is a string that specifies the direction in which the particle is supposed to fly – options: "upLeft", "upRight", "downLeft", "downRight"
  //"ttl" is a number that defines the time the particle is going to be in existence
  //"color" is a string that specifies the color of the particle either as a HEX number or a css color code
  class particle{
    constructor(spawnPoint, emitDirection, ttl, color){
      this.position = {
        x: spawnPoint[0],
        y: spawnPoint[1]
      }
      this.emitDirection = emitDirection;
      this.lifeCycleCounter = 0;
      this.ttl = ttl;
      this.size = simulationConfig.particle_initial_size;
      this.shrinkingSpeed = this.size / this.ttl;
      this.appearance = "fill:"+color;
    };

    act(){
      switch (this.emitDirection){
        case "upLeft":
          this.position.x--;
          this.position.y--;
          break;
        case "upRight":
          this.position.x++;
          this.position.y--;
          break;
        case "downLeft":
          this.position.x--;
          this.position.y++;
          break;
        case "downRight":
          this.position.x++;
          this.position.y++;
          break;
        case "random":
          this.position.x += Math.random() < 0.5 ? -1 : simulationConfig.particle_speed;
          this.position.y += Math.random() < 0.5 ? -1 : simulationConfig.particle_speed;
      };
      this.render();
      this.size -= this.shrinkingSpeed;
    };

    die(){
      var indexToRemove = $scope.simulationWorld.particleEffectsArray.indexOf(this); 
      $scope.simulationWorld.particleEffectsArray.splice(indexToRemove, 1);
      delete this;
    };

    render(){
      if(this.lifeCycleCounter < this.ttl){
        this.points = [[this.position.x, this.position.y], [this.position.x+this.size, this.position.y], [this.position.x+this.size, this.position.y+this.size], [this.position.x, this.position.y+this.size]];
        this.pointsForSVG = ""+this.points[0][0]+","+this.points[0][1]+" "+this.points[1][0]+","+this.points[1][1]+" "+this.points[2][0]+","+this.points[2][1]+" "+this.points[3][0]+","+this.points[3][1];
        this.lifeCycleCounter++;
      }
      else{
        this.die();
      }
    };

  }

  //THIS CLASS IS A TREE THAT CAN BE EATEN 
  //"spawnTime" is a number that specifies the moment of creation in the form of a cycle count
  class tree{
    constructor(spawnTime){
      this.type = 'tree';
      this.spawnTime = spawnTime;
      this.isDead = false;
      this.energy = simulationConfig.trees_starting_energy;
      this.resilience = simulationConfig.trees_starting_resilience+Math.random();
      this.earlyGrowthInterval = simulationConfig.trees_early_growth_interval;
      this.growthInterval = simulationConfig.trees_growth_interval;
      this.rapidGrowthPeriod = simulationConfig.trees_rapid_growth_period;
      this.appearance = simulationConfig.trees_appearance;
      this.illness = undefined;
      this.position = {
        x: Math.floor(Math.random() * Math.floor($scope.svgAreaWidth-40)),
        y: Math.floor(Math.random() * Math.floor($scope.svgAreaHeight-40))
      };
      this.render();
    };

    act(cycleCount){
      var usedGrowthInterval;
        //THE TREES GROW AT A FASTER SPEED DURING THE RAPID GROWTH PERIOD
        if(cycleCount - this.spawnTime <= this.rapidGrowthPeriod){
          usedGrowthInterval = this.earlyGrowthInterval;
        }
        else{
          usedGrowthInterval = this.growthInterval;
        }
        if((cycleCount-this.spawnTime)%usedGrowthInterval == 0 && !this.isDead){
          this.energy++;
          this.render();
        }
        if(this.illness){
          this.illness.act(this);
        }
    };

    fade(value){
      this.energy -= value;
      this.render();
      //THE TREE NEEDS TO DIE BEFOR ITS ENERGY LEVEL IS 0, 
      //BECAUSE OTHERWISE IT WILL GET TOO SMALL FOR THE COLLISION DETECTION TO WORK  
      if(this.energy < simulationConfig.trees_death_threshold){
        this.die();
        var myDeath = true;
        return myDeath;      
      }
    };

    die(){
      if(this.illness){
        this.illness.die();
      }
      var indexToRemove = $scope.simulationWorld.plantArray.indexOf(this); 
      $scope.simulationWorld.plantArray.splice(indexToRemove, 1);
      delete this;
    };

    exposeToInfection(illness){
      //INFECTION CHANCE DEPENDS ON ILLNESS CONTAGIOUSNESS AND ENERGY OF THE POSSIBLE NEW HOST
      var infectionChance = illness.contagiousness / (this.energy/2);
      var diceRoll = Math.floor(Math.random() * Math.floor(100));
      if(diceRoll < infectionChance){
        this.illness = illness;
        this.illness.position = this.position;
        console.log("tree infected with this illness!", illness);
        return true;
      }
      else{
        return false;
      }
    };

    render(){
      this.size = this.energy*this.resilience;
      this.points = [[this.position.x, this.position.y], [this.position.x+this.size, this.position.y], [this.position.x, this.position.y+this.size]];
      this.pointsForSVG = ""+this.points[0][0]+","+this.points[0][1]+" "+this.points[1][0]+","+this.points[1][1]+" "+this.points[2][0]+","+this.points[2][1];
    };
  };

  class illness{
    constructor(generalTarget, suitableHosts){
      this.generalTarget = generalTarget;
      this.suitableHosts = suitableHosts;
      this.contagiousness = Math.floor(Math.random() * Math.floor(100));
      this.energy = Math.floor(Math.random() * Math.floor(3));
      this.position = {};
    };

    act(currentHost){
      this.contagiousness += simulationConfig.illness_contagiousness_increase;
      this.energy += simulationConfig.illness_energy_increase;
      var particleEmitChance = Math.floor(this.energy*2);
      var diceRoll = Math.floor(Math.random() * Math.floor(100));
      if(diceRoll < particleEmitChance){
        $scope.simulationWorld.particleEffectsArray.push(new particle([this.position.x, this.position.y], "random", 20, "black"));
      }
      if(currentHost.type == this.generalTarget){
        currentHost.fade(this.energy/1000);
      }
    };

    die(){
      delete this;
    };
  };

  class squareAnimal{
    constructor(spawnTime, spawnType, spawnLocation, parent){
      this.type = 'squareAnimal';
      this.spawnTime = spawnTime;
      this.isDead = false;
      this.movementTarget = undefined;
      this.appearance = simulationConfig.animals_appearance;
      this.illness = undefined;
      this.isIll = false;
      
      if(spawnType == "initial"){
        this.energy = simulationConfig.animals_base_energy+Math.floor(Math.random() * Math.floor(simulationConfig.animals_high_random_energy));
        this.resilience = simulationConfig.animals_base_resilience+Math.floor(Math.random() * Math.floor(simulationConfig.animals_high_random_resilience));
        this.initialResilience = this.resilience;
        this.movementSpeed = simulationConfig.animals_base_speed+(Math.random()*simulationConfig.animals_max_speed);
        this.shyness = Math.round(Math.random() * (simulationConfig.animals_max_food_competition-1));
        this.position = {
          x: Math.floor(Math.random() * Math.floor($scope.svgAreaWidth-40)),
          y: Math.floor(Math.random() * Math.floor($scope.svgAreaHeight-40))
        };
      }
      else if(spawnType == 'birth'){
        this.energy = parent.energy;
        this.resilience = parent.initialResilience + Math.random()*(Math.random() < 0.5 ? -1 : 1)/5;
        this.initialResilience = this.resilience;
        this.movementSpeed = parent.movementSpeed + Math.random()*(Math.random() < 0.5 ? -1 : 1)/5;
        this.shyness = parent.shyness;
        this.position = {
          x: spawnLocation.x+25,
          y: spawnLocation.y
        };
        if(parent.illness){
          var newIllness = new illness(parent.illness.generalTarget, parent.illness.suitableHosts);
          this.illness = newIllness;
          this.illness.position = this.position;
        }
      }

      this.render();
    };

    idleMovement(){
      var directionSeed = Math.random();
      var newPosXPlus = {
        x: this.position.x + this.movementSpeed,
        y: this.position.y
      };
      var newPosYPlus = {
        x: this.position.x,
        y: this.position.y + this.movementSpeed
      };
      var newPosXMinus = {
        x: this.position.x - this.movementSpeed,
        y: this.position.y
      };
      var newPosYMinus = {
        x: this.position.x,
        y: this.position.y - this.movementSpeed
      };
      if((directionSeed <= 0.25 && this.position.x < $scope.svgAreaWidth) && !this.detectCollision(newPosXPlus)){
        this.position = newPosXPlus;
      }
      else if((directionSeed > 0.25 && directionSeed <= 0.5 && this.position.y < $scope.svgAreaHeight) && !this.detectCollision(newPosYPlus)){
        this.position = newPosYPlus;
      }
      else if((directionSeed > 0.5 && directionSeed <= 0.75 && this.position.x > 0) && !this.detectCollision(newPosXMinus)){
        this.position = newPosXMinus;
      }
      else if((directionSeed > 0.75 && this.position.y > 0) && !this.detectCollision(newPosYMinus)){
        this.position = newPosYMinus;
      }
    };

    moveTowardsTarget(){
      var directionSeed = Math.random();
      var newPosXPlus = {
        x: this.position.x + this.movementSpeed,
        y: this.position.y
      };
      var newPosYPlus = {
        x: this.position.x,
        y: this.position.y + this.movementSpeed
      };
      var newPosXMinus = {
        x: this.position.x - this.movementSpeed,
        y: this.position.y
      };
      var newPosYMinus = {
        x: this.position.x,
        y: this.position.y - this.movementSpeed
      };

      var collidingWithXPlus = this.detectCollision(newPosXPlus);
      var collidingWithYPlus = this.detectCollision(newPosYPlus);
      var collidingWithXMinus = this.detectCollision(newPosXMinus);
      var collidingWithYMinus = this.detectCollision(newPosYMinus);

      if((this.position.x < this.movementTarget.position.x && directionSeed <= 0.4) && !collidingWithXPlus){
        this.position = newPosXPlus;
      }
      else if((this.position.y < this.movementTarget.position.y && directionSeed > 0.4 && directionSeed <= 0.8) && !collidingWithYPlus) {
        this.position = newPosYPlus;
      }
      else if(((this.position.x > this.movementTarget.position.x && directionSeed <= 0.4) || (directionSeed > 0.8 && directionSeed <= 0.9)) && !collidingWithXMinus){
        this.position = newPosXMinus;
      }
      else if(((this.position.y > this.movementTarget.position.y && directionSeed > 0.4 &&  directionSeed <= 0.8) || directionSeed > 0.9) && !collidingWithYMinus){
        this.position = newPosYMinus;
      }

      if((collidingWithXPlus && collidingWithXPlus.type == 'tree') || (collidingWithYPlus && collidingWithYPlus.type == 'tree') || (collidingWithXMinus && collidingWithXMinus.type == 'tree') || (collidingWithYMinus && collidingWithYMinus.type == 'tree')){
        this.eat(this.movementTarget);
      }

      if(this.illness){
        this.illness.act(this);
      }
    };

    convulsions(){
      var contortionIntensity1 = 1+Math.floor(Math.random() * Math.floor(simulationConfig.animals_death_convulsion_intensity));
      var contortionIntensity2 = 1+Math.floor(Math.random() * Math.floor(simulationConfig.animals_death_convulsion_intensity));
      var contortionIntensity3 = 1+Math.floor(Math.random() * Math.floor(simulationConfig.animals_death_convulsion_intensity));
      var contortionIntensity4 = 1+Math.floor(Math.random() * Math.floor(simulationConfig.animals_death_convulsion_intensity));
      this.points = [[this.position.x, this.position.y], [this.position.x+contortionIntensity1, this.position.y], [this.position.x+contortionIntensity2, this.position.y+contortionIntensity3], [this.position.x, this.position.y+contortionIntensity4]];
      this.pointsForSVG = ""+this.points[0][0]+","+this.points[0][1]+" "+this.points[1][0]+","+this.points[1][1]+" "+this.points[2][0]+","+this.points[2][1]+" "+this.points[3][0]+","+this.points[3][1];
    };

    exposeToInfection(illness){
      var infectionChance = illness.contagiousness / (this.energy/2);
      var diceRoll = Math.floor(Math.random() * Math.floor(100));
      if(diceRoll < infectionChance){
        this.illness = illness;
        this.illness.position = this.position;
        console.log("squareAnimal infected with this illness!", illness);
        this.isIll = true;
        return true;
      }
      else{
        return false;
      }
    };

    detectCollision(newPosition){
      var point1 = [newPosition.x, newPosition.y];
      var point2 = [newPosition.x+this.size, newPosition.y];
      var point3 = [newPosition.x+this.size, newPosition.y+this.size];
      var point4 = [newPosition.x, newPosition.y+this.size];
      var point5 = [this.position.x+this.size/2, this.position.y+this.size/2];
      for(var i=0; i < $scope.simulationWorld.animalArray.length; i++){
        var sqAnimalToTest = $scope.simulationWorld.animalArray[i];
        if(sqAnimalToTest !== this && !sqAnimalToTest.isDying){
          if($scope.isPointInSquareAnimal(point1, sqAnimalToTest) ||
              $scope.isPointInSquareAnimal(point2, sqAnimalToTest) ||
                $scope.isPointInSquareAnimal(point3, sqAnimalToTest) ||
                  $scope.isPointInSquareAnimal(point4, sqAnimalToTest)){
            return sqAnimalToTest;
          }
        }
      }
      for(var i=0; i < $scope.simulationWorld.plantArray.length; i++){
        var treeToTest = $scope.simulationWorld.plantArray[i];
        if($scope.isPointInTree(point1, treeToTest) ||
            $scope.isPointInTree(point2, treeToTest) ||
              $scope.isPointInTree(point3, treeToTest) ||
                $scope.isPointInTree(point4, treeToTest) ||
                  $scope.isPointInTree(point5, treeToTest)){
          return treeToTest;
        }
        
      }
      return undefined;
    };

    act(){
      var oldPosX = this.position.x;
      var oldPosY = this.position.y;

      if(!this.movementTarget && !this.isDying || this.isBreeding){
        this.idleMovement();
      }
      else if(this.movementTarget && !this.isDying){
        this.moveTowardsTarget();
      }

      if(this.isDying){
        this.appearance = "fill:blue;stroke:black;stroke-width:0";
        this.dyingCountdown--;
        if(this.dyingCountdown > 50 && this.dyingCountdown%5 == 0){
          this.convulsions();
        }
        if(this.dyingCountdown <= 50){
          this.appearance = "fill:black;stroke:black;stroke-width:0;transition:fill 3s";
        }
        if(this.dyingCountdown == 0){
          this.isDying = false;
          this.isDead = true;
          if(this.illness){
            delete this.illness;
          }
          var indexToRemove = $scope.simulationWorld.animalArray.indexOf(this); 
          $scope.simulationWorld.animalArray.splice(indexToRemove, 1);
          delete this;
        }
      }

      if(this.size > simulationConfig.animals_procreation_threshold && !this.isBreeding){
        this.movementTarget = undefined;
        this.isBreeding = true;
        this.procreatingCountdown = simulationConfig.animals_procreation_duration;
      }

      if(this.isBreeding && this.procreatingCountdown > 0){
        this.procreatingCountdown--;
        if(this.procreatingCountdown%5 == 0){
          this.appearance = "fill:blue;stroke:black;stroke-width:3;";
        }
        else{
          this.appearance = "fill:blue;stroke:black;stroke-width:0;";
        }
      }
      else if(this.isBreeding && this.procreatingCountdown == 0){
        this.procreate();
      } 
      //FADE IF MOVED THIS CYCLE
      if((oldPosX != this.position.x || oldPosY != this.position.y)){
        this.fade(Math.abs((oldPosX-this.position.x) + (oldPosY-this.position.y))/1000);
      }
      else{
        //HAS TO MOVE!
        this.position.x += 1;
      }
      //DO COLLISION CHECK
      var collidedWith = this.detectCollision(this.position);
      this.reactToCollision(collidedWith);

      //ILLNESS HAS TO BE AT THE SAME POSITION AS ANIMAL
      if(this.illness){
        this.illness.position = this.position;
      }

      this.render();
    };

    reactToCollision(collidedWith){
        var point1 = [this.position.x, this.position.y];
        var point2 = [this.position.x+this.size, this.position.y];
        var point3 = [this.position.x+this.size, this.position.y+this.size];
        var point4 = [this.position.x, this.position.y+this.size];
        var point5 = [this.position.x+this.size/2, this.position.y+this.size/2];
        var movedDownRight = false;
        var movedDownLeft = false;
        var movedUpLeft = false;
        var movedUpRight = false;
        if(collidedWith && collidedWith.type == 'squareAnimal'){
          if($scope.isPointInSquareAnimal(point1, collidedWith)){
            this.position.x += 3;
            this.position.y += 3;
            movedDownRight = true;
          }
          if($scope.isPointInSquareAnimal(point2, collidedWith)){
            this.position.x -= 3;
            this.position.y += 3;
            movedDownLeft = true;
          }
          if($scope.isPointInSquareAnimal(point3, collidedWith)){
            this.position.x -= 3;
            this.position.y -= 3;
            movedUpLeft = true;
          }
          if($scope.isPointInSquareAnimal(point4, collidedWith)){
            this.position.x += 3;
            this.position.y -= 3;
            movedUpRight = true;
          }
        }
        if(collidedWith && collidedWith.type == 'tree'){
          if($scope.isPointInTree(point1, collidedWith)){
            this.position.x += 3;
            this.position.y += 3;
            movedDownRight = true;
          }
          if($scope.isPointInTree(point2, collidedWith)){
            this.position.x -= 3;
            this.position.y += 3;
            movedDownLeft = true;
          }
          if($scope.isPointInTree(point3, collidedWith)){
            this.position.x -= 3;
            this.position.y -= 3;
            movedUpLeft = true;
          }
          if($scope.isPointInTree(point4, collidedWith)){
            this.position.x += 3;
            this.position.y -= 3;
            movedUpRight = true;
          }
        }
        if(movedDownRight && movedDownLeft && movedUpLeft && movedUpRight){
          this.position.x += 3;
        }

        if(collidedWith && collidedWith.illness && collidedWith.illness.suitableHosts.indexOf(this.type) > -1 && this.illness === undefined){
          var newIllness = new illness(collidedWith.illness.generalTarget, collidedWith.illness.suitableHosts);
          console.log("collided with "+collidedWith.type+", it was ill and i am a suitable host!")
          this.exposeToInfection(newIllness);
        }
    };

    fade(value){
      if(this.resilience*this.energy >= 1){
        this.resilience -= value/2;
        this.energy -= value;
      }
      if(this.resilience*this.energy < simulationConfig.animals_hunger_threshold){
        this.findClosestFoodSource();
      }
      if(this.resilience*this.energy < simulationConfig.animals_death_threshold && !this.isDying){
        this.die();
      }

    };

    findClosestFoodSource(){
      var currentContender = $scope.simulationWorld.plantArray[0];
      var contenderPopularity = 0;

      for(var i=0; i < $scope.simulationWorld.plantArray.length; i++){
        var contenderDistance = Math.abs(Math.abs(this.position.x - currentContender.position.x) + Math.abs(this.position.y - currentContender.position.y));
        var newDistance = Math.abs(Math.abs(this.position.x - $scope.simulationWorld.plantArray[i].position.x) + Math.abs(this.position.y - $scope.simulationWorld.plantArray[i].position.y));
        if(newDistance < contenderDistance){
          currentContender = $scope.simulationWorld.plantArray[i];
        }
      }
      for(var i=0; i < $scope.simulationWorld.animalArray.length; i++){
        var rival = $scope.simulationWorld.animalArray[i];
        if(rival.movementTarget == currentContender){
          contenderPopularity++;
        }
      }

      if(simulationConfig.animals_max_food_competition-this.shyness > contenderPopularity){
        this.movementTarget = currentContender;
      }
      
    };

    eat(target){
      $scope.simulationWorld.particleEffectsArray.push(new particle(target.points[0], "upRight", 10, "lime"));
      $scope.simulationWorld.particleEffectsArray.push(new particle(target.points[0], "upLeft", 10, "lime"));
      $scope.simulationWorld.particleEffectsArray.push(new particle(target.points[0], "downRight", 10, "lime"));
      $scope.simulationWorld.particleEffectsArray.push(new particle(target.points[0], "downLeft", 10, "lime"));
      var eatingInterval = this.resilience / (target.resilience*simulationConfig.animals_eating_delay_factor);
      if(target.fade(eatingInterval)){
        this.movementTarget = undefined;
      }
      this.energy += eatingInterval;
    };

    die(){
      this.isDying = true;
      this.dyingCountdown = simulationConfig.animals_death_duration;
    };

    procreate(){
      this.energy = this.energy/2;
      $scope.simulationWorld.animalArray.push(new squareAnimal(0, 'birth', this.position, this));
      this.isBreeding = false;
      this.appearance = "fill:blue;stroke:black;stroke-width:0";
      $scope.simulationWorld.particleEffectsArray.push(new particle([this.points[0][0]+this.size, this.points[0][1]], "upRight", 20, "blue"));
      $scope.simulationWorld.particleEffectsArray.push(new particle([this.points[0][0],this.points[0][1]], "upLeft", 20, "blue"));
      $scope.simulationWorld.particleEffectsArray.push(new particle([this.points[0][0]+this.size, this.points[0][1]+this.size], "downRight", 20, "blue"));
      $scope.simulationWorld.particleEffectsArray.push(new particle([this.points[0][0],this.points[0][1]+this.size], "downLeft", 20, "blue"));
    };

    render(){
      if(!this.isDying){
        this.size = this.energy*this.resilience;
        this.points = [[this.position.x, this.position.y], [this.position.x+this.size, this.position.y], [this.position.x+this.size, this.position.y+this.size], [this.position.x, this.position.y+this.size]];
        this.pointsForSVG = ""+this.points[0][0]+","+this.points[0][1]+" "+this.points[1][0]+","+this.points[1][1]+" "+this.points[2][0]+","+this.points[2][1]+" "+this.points[3][0]+","+this.points[3][1];
      }
    };
  };

  class world{
    constructor(fertility, startingPopulation){
      this.fertility = fertility;
      this.plantArray = [];
      this.animalArray = [];
      this.particleEffectsArray = [];
      for(var i = 0; i<startingPopulation; i++){
        this.animalArray.push(new squareAnimal(0, 'initial'));
      }
    };

    treeSpawn(seed, cycleCount){
      if(seed * this.fertility >= 1){
        this.plantArray.push(new tree(cycleCount));
      }
    };

    initialTreeSpawn(amount){
      for(var i = 0; i < amount; i++){
        this.plantArray.push(new tree(0));
      }
    };
  };

  $scope.spawnAnimal = function(){
    $scope.simulationWorld.animalArray.push(new squareAnimal(0, 'initial'));
  };

  $scope.spawnIllness = function(){
    if($scope.simulationWorld.plantArray.length > 0){
      var newIllness = new illness('squareAnimal', ['tree', 'squareAnimal']);
      console.log("created this illness", newIllness);
      for(var i=0; i < $scope.simulationWorld.plantArray.length; i++){
        if($scope.simulationWorld.plantArray[i].illness === undefined){
          if($scope.simulationWorld.plantArray[i].exposeToInfection(newIllness)){
            break;
          }
        }
      }
    }
  };

  //For collision detection between squares
  $scope.isPointInSquareAnimal = function(point, sqAnimal){
    pointX = point[0];
    pointY = point[1];
    if(pointX >= (sqAnimal.position.x-1)
      && pointX <= (sqAnimal.position.x+sqAnimal.size+1)
        && pointY >= (sqAnimal.position.y-1) 
          && pointY <= (sqAnimal.position.y+sqAnimal.size+1)){
        return true;
    }
    else{
      return false;
    }
  };

  //For collision detection between squares and trees
  $scope.isPointInTree = function(point,tree){
    var v0 = [tree.points[2][0]-tree.points[0][0],tree.points[2][1]-tree.points[0][1]];
    var v1 = [tree.points[1][0]-tree.points[0][0],tree.points[1][1]-tree.points[0][1]];
    var v2 = [point[0]-tree.points[0][0],point[1]-tree.points[0][1]];

    var dot00 = (v0[0]*v0[0]) + (v0[1]*v0[1]);
    var dot01 = (v0[0]*v1[0]) + (v0[1]*v1[1]);
    var dot02 = (v0[0]*v2[0]) + (v0[1]*v2[1]);
    var dot11 = (v1[0]*v1[0]) + (v1[1]*v1[1]);
    var dot12 = (v1[0]*v2[0]) + (v1[1]*v2[1]);

    var invDenom = 1/ (dot00 * dot11 - dot01 * dot01);

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return ((u >= 0) && (v >= 0) && (u + v < 1));
  };

  $scope.init = function(){
    var cycleCount = 0;
    $scope.showTargetLines = false;
    $scope.showAnimalInfo = false;
    var simulationShell = angular.element(document.querySelector('#simulationShell')); 
    $scope.svgAreaHeight = simulationShell[0].offsetHeight;
    $scope.svgAreaWidth = simulationShell[0].offsetWidth-40;
    $scope.simulationWorld = new world(simulationConfig.world_fertility,simulationConfig.world_starting_population);
    $scope.simulationWorld.initialTreeSpawn(simulationConfig.world_initial_tree_amount);
    
    simulationLoop = $interval(function() {
      cycleCount++;
      seed = Math.floor(Math.random() * Math.floor(1000));
      $scope.simulationWorld.treeSpawn(seed, cycleCount);
      if(cycleCount%simulationConfig.illness_spawn_cycle == 0){
         $scope.spawnIllness();
      }
      for(var i=0; i < $scope.simulationWorld.plantArray.length; i++){
        $scope.simulationWorld.plantArray[i].act(cycleCount);
      }
      for(var i=0; i < $scope.simulationWorld.animalArray.length; i++){
        if(!$scope.simulationWorld.animalArray[i].isDead){
          $scope.simulationWorld.animalArray[i].act();
        }
      }
      for(var i=0; i < $scope.simulationWorld.particleEffectsArray.length; i++){
        $scope.simulationWorld.particleEffectsArray[i].act();
      }
    }, simulationConfig.rendering_interval);

  };


   $scope.init();
}

