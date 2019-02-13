simulatedEcologyApp.constant('simulationConfig', {
	//PARTICLE EFFECTS
	particle_initial_size: 5,
	particle_speed: 1,
	//TREES
	trees_starting_energy: 1,
	trees_starting_resilience: 1,
	trees_early_growth_interval: 25,
	trees_growth_interval: 100,
	trees_rapid_growth_period: 200,
	trees_death_threshold: 7,
	trees_appearance: "fill:lime;stroke:black;stroke-width:0",
	//SQUARE ANIMALS
	animals_base_speed: 0.5,
	animals_max_speed: 2.5,
	animals_base_energy: 2,
	animals_high_random_energy: 3,
	animals_base_resilience: 2,
	animals_high_random_resilience: 5,
	animals_death_convulsion_intensity: 50,
	animals_procreation_duration: 100,
	animals_procreation_threshold: 25,
	animals_hunger_threshold: 40,
	animals_death_threshold: 1,
	animals_max_food_competition: 2,
	animals_eating_delay_factor: 5,
	animals_death_duration: 100,
	animals_appearance: "fill:blue;stroke:white;stroke-width:0",
	//WORLD
	world_fertility: 0.00103,
	world_starting_population: 3,
	world_initial_tree_amount: 0,
	//ILLNESS
	illness_contagiousness_increase: 0.01,
	illness_energy_increase: 0.001,
	illness_spawn_cycle: 500,
	//GLOBAL
	rendering_interval: 50
});