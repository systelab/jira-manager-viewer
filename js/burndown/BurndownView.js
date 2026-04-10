(function(views)
{
    var self;

    function BurndownView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(BurndownView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.issues = [];
                this.resources = {};
				this.userStories = {};
				
                $(".playlists-list").on("loaded", function (evt, data)
                {									
                    self.issues = data.issues;
                });
                
				$(document).on("sprint", function (evt, data)
                {
                    self.sprint = data;
					self.sprint.name = self.sprint.name.replace(/ /g, '_');
                });
				
				$(document).on("board", function (evt, data)
                {
                    self.board = data;
                });
				
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Burndown"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                
                        self.presenter.load(self.board.name, self.sprint.name);
                    });
                });
				this.visibleCharts = {};
				$(document).on("click", "#saveChartButton", function() 
				{
					if (!self.isGlobalBurndownView)
					{
						self.saveVisibleCharts();
					}
				});
            },
            enumerable: false
        },
		saveVisibleCharts : {
            value: function()
            {
                var self = this;

				var visibles = {};
				$.each(self.myChart.data.datasets, function(i, ds) 
				{						
					var meta = self.myChart.getDatasetMeta(i);

					var isVisible = false;

					if (meta && meta.hidden !== undefined && meta.hidden !== null)
					{
						isVisible = !meta.hidden;
					}
					else
					{
						isVisible = !ds.hidden;
					}

					visibles[ds.label] = isVisible;
				});

				self.visibleCharts = visibles;
				self.save();
            },
			enumerable: false
        },
		loadVisibleCharts: {
			value: function() 
			{
				var self = this;

				var visibles = self.visibleCharts;
                $.each(self.myChart.data.datasets, function(i, dataset) 
				{
                    if (visibles.hasOwnProperty(dataset.label)) 
					{
						dataset.hidden = !visibles[dataset.label];
                    }
                });

				self.myChart.update();
			},
			enumerable: false
		},		
        onLoadSettings : {
            value: function(data)
            {
                var self = this;
                this.settings = data;                
                $(".main-view").load("js/burndown/template.html", function()
                {
                    self.onSprint();
                });
            },
            enumerable: false
        },
        calcBusinessDays : {
            value: function(startDate, endDate)
            {
                var day = moment(startDate);
                var businessDays = new Array();

                while (day.isSameOrBefore(endDate,'day'))
                {
                    if (day.day()!=0 && day.day()!=6)
                    {
                        businessDays.push(day.format('DD/MM/YYYY'));
                    }
                    day.add(1,'d');
                }
                
                return businessDays;
            },
            enumerable: false
        },
        onSprint: {
            value: function()
            {
                var self = this;
                
                self.workingDays = self.calcBusinessDays(self.sprint.startDate, self.sprint.endDate);
                        
				var table = $("table.burndown");
				
				var row = $("<tr/>");
				
				$("<th/>", {html: "US"}).appendTo(row);
				$("<th/>", {html: "Type"}).appendTo(row);
				$("<th/>", {html: "Task"}).appendTo(row);
				$("<th/>", {html: "Summary"}).appendTo(row);
				$("<th/>", {html: "Estimated"}).appendTo(row);
				$("<th/>", {html: ""}).appendTo(row);
				
				for(var i = 0; i < self.workingDays.length; ++i)
				{
					$("<th/>", {html: self.workingDays[i].substring(0, self.workingDays[i].indexOf("/"))}).appendTo(row);
				}
				
				row.appendTo(table);
				
				self.getIssues();
                
                self.setupChart();
            },
            enumerable: false
        },
        getIssues : {
            value: function()
            {
                var self = this;
                
                var issues = [];
                $.each(self.issues, function()
                {
                    issues.push(this.key);
                });
                		
                self.presenter.getIssues(self.issues, self.workingDays);
            },
            enumerable: false
        },
        showError : {
            value: function(data)
            {
                showError(data);
            },
            enumerable: false
        },
        setupChart : {
            value: function () {
                const labels = Array.from(this.workingDays, x => moment(x, "DD/MM/YYYY").format("DD/MM"));
				labels.unshift("START");
                this.chartData = {
                    labels: labels,
                    datasets: []
                };

                const config = {
                    type: 'line',
                    data: this.chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Burndown'
                            },
                            datalabels: {
                                display: false
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        scales: {
                            x: {
                                display: true,
                                title: {
                                    display: true,
                                    text: 'Days'
                                }
                            },
                            y: {
                                display: true,
                                title: {
                                    display: true,
                                    text: 'Tasks'
                                }
                            },
							y2: {
								display: false,
								position: 'right',
								min: 0,
								max: 100,
								grid: {
									drawOnChartArea: false
								}
							},
							yOffSprintHours: {
								display: true,
								min: 0,
								position: 'right',
								grid: {
									display: false
								},
								title: {
									display: true,
									text: 'Off Sprint Hours'
								}
							}
                        }
                    },
                    plugins: [ChartDataLabels]
                };

                const ctx = document.getElementById('myChart');
                this.myChart = new Chart(ctx, config);
            },
            enumerable: false
        },
        onAssignableUsers : {
            value: function(data)
            {
				var self = this;
				
				this.users = [];
				
				var resources = this.template.find(".body");
				
                $.each(data, function()
                {
					if(this.active)
					{
						var clone = self.resourcesTemplate.clone();
						clone.html("<img class='icon' src='" + this.avatarUrls["32x32"] + "' title='" + this.displayName + "'/><span class='status_id'>" + this.displayName +"</span>" + this.emailAddress);
					
						clone.click(function()
						{
							$(this).toggleClass("active");
							var cnt = self.dialog.find(".body .context-menu-item.active").length;
							self.dialog.find(".selection").html(cnt + " elements selected");
						}).appendTo(resources);
					}
                });
            },
            enumerable: false
        },
        updateEstimateResources : {
            value: function(task, table)
            {
				var self = this;
				
				table.html("");
				
                $.each(this.resources[task], function(name)
                {
					var tr = $("<tr/>");
				
					$.each(this, function(j)
					{
						var td = $("<td/>");
						
						var className = this.type || "full";
						
						var container = $("<div/>", {class: className}).click(function()
						{
							if($(this).hasClass("full"))
							{
								self.resources[task][name][j].type = "no";
								$(this).removeClass("full").addClass("no");
							}
							else if($(this).hasClass("mid"))
							{
								self.resources[task][name][j].type = "full";
								$(this).removeClass("mid").addClass("full");
							}
							else
							{
								self.resources[task][name][j].type = "mid";
								$(this).removeClass("no").addClass("mid");
							}

							self.save();
						}).appendTo(td);
					
						$("<img/>", {class: "icon", src: this.src, title: this.name}).appendTo(container);
						
						td.appendTo(tr);
					});
					
					tr.appendTo(table);
                });
            },
            enumerable: false
        },
        createEstimateResources : {
            value: function(name, color)
            {
				var self = this;
				
				var table = $("<table/>", {"class": "assigned ", style: "background-color:" + color}).data("task", name);
				
				var resourceContainer = $("<div/>", {class: "resourceContainer"});
				
				$("<i/>", {class: "iconMenu fas fa-exchange-alt"}).click(function()
                {
					self.showDialog(name, table);
                }).appendTo(resourceContainer);
				
				table.appendTo(resourceContainer);
				
				resourceContainer.appendTo(".uncommited-table-container .estimate_resources");
				
				self.updateEstimateResources(name, table);
            },
            enumerable: false
        },		
		updateEstimateUSResources : {
            value: function(task, table)
            {
				var self = this;
				
				table.html("");
				
                $.each(this.userStories, function(snowId, days) {
                    var tr = $("<tr/>", { id: snowId });

                    $.each(days, function(j, dayData) {
                        var td = $("<td/>");

                        var className = dayData.type || "no";

                        var container = $("<div/>", { class: className }).click(function() {
                            if ($(this).hasClass("full"))
							{
                                self.userStories[snowId][j].type = "no";
                                $(this).removeClass("full").addClass("no");
                            } 
							else
							{
                                $.each(self.userStories[snowId], function (index, day) {
                                    if (day.type === "full") 
									{
                                        day.type = "no";
                                        table.find(`tr#${snowId} td:eq(${index}) div`).removeClass("full").addClass("no");
                                    }
                                });

                                self.userStories[snowId][j].type = "full";
                                $(this).removeClass("no").addClass("full");
                            }

                            self.save();
                        }).appendTo(td);

                        $("<span/>", { class: "us-span", title: snowId, text: snowId.replace("SNOW-", "") }).appendTo(container);

                        td.appendTo(tr);
                    });

                    tr.appendTo(table);
                });
            },
            enumerable: false
        },
		createUserStoriesScope : {
			value: function(name, color)
			{
				var self = this;
				
				var table = $("<table/>", {"class": "assigned ", style: "background-color:" + color}).data("task", name);
				
				var resourceContainer = $("<div/>", {class: "resourceContainer"});
				
				$("<i/>", {class: "iconMenu fas fa-exchange-alt"}).click(function()
                {
					self.showUSDialog(name, table);
                }).appendTo(resourceContainer);
				
				table.appendTo(resourceContainer);
				
				resourceContainer.appendTo(".uncommited-table-container .estimate_resources");
				
				self.updateEstimateUSResources(name, table);
			}
		},		
        onLoad : {
            value: function(data)
            {
				this.resources = data.resources || {};
        		this.userStories = data.userStories || {};
				this.visibleCharts = data.visibleCharts || {};
				this.presenter.getSettings();
            },
            enumerable: false
        },
        showDialog : {
            value: function(task, table)
            {
				var self = this;
				
				$(".modal-dialog").load("js/burndown/resources.html", function()
				{
					self.template = $(this);
					
					self.resourcesTemplate = self.template.find(".body li").detach();
					
					self.dialog = $(this).find(".resource-dialog");
					
					self.dialog.find(".name").html(task + " Resources")
					
					self.dialog.find(".mdl-button.close").click(function()
					{
						self.dialog[0].close();
					});
					
					self.dialog.find(".mdl-button.confirm").click(function()
					{
						self.commit(task, table);
					});
				   
					self.dialog[0].showModal();
					
					self.presenter.getAssignableUsers(self.issues[0].key);
				});
            },
            enumerable: false
        },
        showUSDialog : {
            value: function(task, table)
            {
				var self = this;
				
				$(".modal-dialog").load("js/burndown/resources.html", function()
				{
					self.template = $(this);
					
					self.resourcesTemplate = self.template.find(".body li").detach();
					
					self.dialog = $(this).find(".resource-dialog");
					
					self.dialog.find(".name").html(task + " Resources")
					
					self.dialog.find(".mdl-button.close").click(function()
					{
						self.dialog[0].close();
					});
					
					self.dialog.find(".mdl-button.confirm").click(function()
					{
						self.UScommit(task, table);
					});
				   
					self.dialog[0].showModal();
					
					self.createUSListOnDialog(self.issues);
				});
            },
            enumerable: false
        },
		createUSListOnDialog : {
			value: function(data)
			{
				var self = this;
				
				this.users = [];
				
				var resources = this.template.find(".body");
				
				$.each(data, function()
				{					
					var clone = self.resourcesTemplate.clone();
					clone.html("<span class='status_id'>" + this.key +"</span>" + this.fields.summary);
				
					clone.click(function()
					{
						$(this).toggleClass("active");
						var cnt = self.dialog.find(".body .context-menu-item.active").length;
						self.dialog.find(".selection").html(cnt + " elements selected");
					}).appendTo(resources);
					
				});
			},
			enumerable: false
		},
        onSave : {
            value: function(data)
            {
				this.computeEstimateLegacy();
            },
            enumerable: false
        },
        save : {
            value: function()
            {
				this.presenter.save(this.board.name, this.sprint.name, {
					resources: this.resources,
					userStories: this.userStories,
					visibleCharts: this.visibleCharts
				});
            },
            enumerable: false
        },
        commit : {
            value: function(task, table)
            {
                var self = this;
                
				table.html("");
				
				var resources = {};
				
                $.each($(this.dialog).find(".body .context-menu-item.active"), function()
                {
					var name = $(this).find(".status_id").text();
					
					resources[name] = new Array();
					
					var element = $(this);
					
					$.each(self.workingDays, function(i)
                    {
                       resources[name].push({name: element.find(".icon").attr("title"), "src": element.find(".icon").attr("src"), "type": "full"});	
                    });
                });
				
				self.resources[task] = resources;
				
				self.updateEstimateResources(task, table);
				self.save();
				
				this.dialog[0].close();
            },
            enumerable: false
        },
		
        UScommit : {
            value: function(task, table)
            {
                var self = this;
                
				table.html("");
				
				var userStories = {};
				
                $.each($(this.dialog).find(".body .context-menu-item.active"), function()
                {
					var snowId = $(this).find(".status_id").text();	
					userStories[snowId] = new Array();

					$.each(self.workingDays, function(i)
                    {
						userStories[snowId].push({index: i + 1, snowId: snowId, "type": "no"});
                    });
                });
				
				self.userStories = userStories;
				self.updateEstimateUSResources(task, table);
				self.save();
				
				this.dialog[0].close();
            },
            enumerable: false
        },		
		onBurndownComputed: {
			value: function(burndownDataSets, burndownConfig)
			{
				var self = this;

				const chartDrawers = {
					globalBurndown: () => self.drawBurndownLine(burndownDataSets.globalBurndown, "Burndown", "#006905"),
					offSprintHours: () => self.drawOffSprintHours(burndownDataSets.offSprintHours),
					usClosureEstimate: () => self.drawUSClosureEstimate(burndownDataSets.usClosureEstimate),
					usCompleted: () => self.drawUSCompleted(burndownDataSets.usCompleted),
					implementationTasksBurndown: () => self.drawBurndownLine(burndownDataSets.implementationTasksBurndown, "Implementation Tasks Burndown", "#1e88e5"),
					qaTasksBurndown: () => self.drawBurndownLine(burndownDataSets.qaTasksBurndown, "QA Tasks Burndown", "#ffb300"),
					testAutoTasksBurndown: () => self.drawBurndownLine(burndownDataSets.testAutoTasksBurndown, "Test Auto Tasks Burndown", "#8e24aa")
				};

				// Draw only the lines existing in burndownDataSets
				Object.keys(burndownDataSets).forEach(function(key) {
					if (burndownDataSets[key] && chartDrawers[key]) {
						chartDrawers[key]();
					}
				});

				//self.loadVisibleCharts(); TO ADAPT

				self.createEstimateResources("globalBurndownEstimate", "#ca1818ff");
				
				if (burndownConfig.lines.includes("usClosureEstimate")) self.createUserStoriesScope("User Stories", "#B0B0B0");
				if (burndownConfig.lines.includes("implementationTasksBurndown")) self.createEstimateResources("implementationTasksBurndown", "#1e88e5");
				if (burndownConfig.lines.includes("qaTasksBurndown")) self.createEstimateResources("qaTasksBurndown", "#ffb300");
				if (burndownConfig.lines.includes("testAutoTasksBurndown")) self.createEstimateResources("testAutoTasksBurndown", "#8e24aa");
				
				self.myChart.update();
				self.save();
			},
			enumerable: false
		},
		onEstimateComputed: {
			value: function(dataSets) // upgrade: only one
			{
				var self = this;

				const chartDrawersEstimatesLines = {
					globalBurndownEstimate: () => self.drawEstimateLine(dataSets.globalBurndownEstimate, "#ca1818ff", "Global Burndown Estimate"),
					usClosureEstimate: () => self.drawUSClosureEstimate(dataSets.usClosureEstimate),
					implementationTasksEstimate: () => self.drawEstimateLine(dataSets.implementationTasksEstimate, "#1e88e5", "Implementation Tasks Estimate"),
					qaTasksEstimate: () => self.drawEstimateLine(dataSets.qaTasksEstimate, "#ffb300", "QA Tasks Estimate"),
					testAutoTasksEstimate: () => self.drawEstimateLine(dataSets.testAutoTasksEstimate, "#8e24aa", "Test Auto Tasks Estimate")
				};

				// Draw only the lines existing in dataSets
				Object.keys(dataSets).forEach(function(key) {
					if (dataSets[key] && chartDrawersEstimatesLines[key]) {
						chartDrawersEstimatesLines[key]();
					}
				});
				self.myChart.update();
			},
			enumerable: false
		},
		drawBurndownLine: {
			value: function(dataSet, name, color)
			{
				var self = this;

				var dataset =
				{
					label: name,
					data: dataSet,
					backgroundColor: color,
					borderColor: color,
					fill: false,
					tension: 0.4,
					cubicInterpolationMode: 'monotone',
					order: 1000,
					hidden: false,
					spanGaps: true
				};

				self.chartData.datasets.push(dataset);
			},
			enumerable: false
		},
		drawEstimateLine: {
			value: function(data, color, name)
			{
				var self = this;

				var dataset = self.chartData.datasets.find(({ label }) => label === name);
				if (dataset)
				{
					dataset.data = data;
				}
				else
				{					
					var dataset =
					{
						label: name,
						data: data,
						backgroundColor: color,
						borderColor: color,
						fill: false,
						tension: 0.4,
						borderDash: [5, 5],
						cubicInterpolationMode: 'monotone',
						order: 1000,
						hidden: false
					};
				}
				
				self.chartData.datasets.push(dataset);
			},
			enumerable: false
		},
		drawOffSprintHours: {
			value: function(data)
			{
				var self = this;

				var dataset =
				{
					label: "Off-Sprint Hours",
					data: data,
					backgroundColor: "#ffffff",
					borderColor: "#ff6b6b",
					pointRadius: 4,
					pointBorderWidth: 2,
					pointStyle: 'rectRot',
					borderWidth: 0,
					fill: false,
					tension: 0,
					showLine: false,
					spanGaps: true,
					yAxisID: 'yOffSprintHours'
                };
                    
                self.chartData.datasets.push(dataset);                
			},
			enumerable: false
		},
		drawUSClosureEstimate: {
			value: function(data)
			{
				var self = this;

				var dataset = self.chartData.datasets.find(({ label }) => label === "User Stories");
				if (dataset)
				{
					dataset.data = data.dataSet;
					dataset.usKeys = data.usKeys;
				}
				else
				{
					var dataset = 
					{
						label: "User Stories",
						data: data.dataSet,
						usKeys: data.usKeys,
						backgroundColor: "#B0B0B0",
						borderColor: "#B0B0B0",
						borderDash: [5, 5],
						pointRadius: 0,
						fill: false,
						tension: 0,
						spanGaps: true,
						yAxisID: 'y2',
						datalabels: {
							display: function(context) {
								return context.dataIndex !== 0;
							},
							align: 'center',
							anchor: 'end',
							color: '#B0B0B0',
							backgroundColor: '#fff',
							borderColor: '#B0B0B0',
							borderRadius: 4,
							borderWidth: 1,
							font: {
								weight: 'bold'
							},
							formatter: function(_, context) {
								return context.dataIndex !== 0 && context.dataset.usKeys &&
									context.dataset.usKeys[context.dataIndex]
									? context.dataset.usKeys[context.dataIndex]
									: '';
							}
						}
					};
				}
				self.chartData.datasets.push(dataset);
			},
			enumerable: false
		},
		drawUSCompleted: {
            value: function(data)
            {
                var self = this;
                var userStoriesColor = "#fdb13e83";

                var dataset =
                {
                    label: "% US Completed",
                    data: data,
                    backgroundColor: userStoriesColor,
                    borderColor: userStoriesColor,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    borderWidth: 0,
                    fill: true,
                    tension: 0,
                    spanGaps: true,
                    yAxisID: 'y2',
                    order: 1,
                    hidden: false,
                    datalabels: {
                        display: false
                    }
                };

                self.chartData.datasets.push(dataset);
            },
            enumerable: false
        },
	});
    views.BurndownView = BurndownView;
})(viewer.views);