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
				this.backupDatasets = [];
				this.processTodayData = false;
				
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
				//switch charts
				this.isGlobalBurndownView = false;
				
				$(document).on("click", "#switchChartButton", function()
				{
					self.isGlobalBurndownView = !self.isGlobalBurndownView;

					var copyDataset = self.myChart.data.datasets.slice();					
					self.myChart.data.datasets = self.backupDatasets.slice();
					self.backupDatasets = copyDataset.slice();
					
					if (!self.isGlobalBurndownView)
					{
						self.loadVisibleCharts();
					}
					else
					{
						self.myChart.update();
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
        onSubtask : {
            value: function(data)
            {
                var self = this;
                
                //if(data.fields.timetracking.originalEstimateSeconds > 0)
                {
                    var table = $("table.burndown");
                    
                    var tbody = table.find("#" + data.fields.parent.key);
                    
                    if(tbody.length == 0)
                    {
                        tbody = $("<tbody/>", {id: data.fields.parent.key});
                        tbody.appendTo(table);
                        
                        $("<tbody/>", {html: "<tr/>"}).appendTo(table);
                    }
                
                    var row = $("<tr/>");
                    
                    var estimate = 1;//data.fields.timetracking.originalEstimateSeconds / 3600;
                    $("<td/>", {html: data.fields.parent.key}).appendTo(row);
                    $("<td/>", {html: data.fields.issuetype.name}).appendTo(row);
                    $("<td/>", {html: data.key}).appendTo(row);
                    $("<td/>", {html: data.fields.summary}).appendTo(row);
                    $("<td/>", {html: estimate}).appendTo(row);
                    $("<td/>", {html: ""}).appendTo(row);
                   
                    var changes = new Array(self.workingDays.length);
                    var closedTask = new Array(self.workingDays.length);
                    
                    changes.fill(estimate);
                    closedTask.fill(0);
					
					var dataSetBurnUp = self.chartData.datasets.find(({ label }) => label === "Burn up");

					var dataSet = self.chartData.datasets.find(({ label }) => label === data.fields.issuetype.name);
					var dataSetEstimate = self.chartData.datasets.find(({ label }) => label === data.fields.issuetype.name + " Estimate");
					
					if(!dataSet)
					{
						dataSet = {
						  label: data.fields.issuetype.name,
						  fill: false,
						  backgroundColor: "#fff",
						  borderColor: self.getColor(self.chartData.datasets.length),
						  data: new Array(self.workingDays.length),
						  cubicInterpolationMode: 'monotone',
						  tension: 0.4
						};
						
						dataSet.data.fill(0);
						
						self.chartData.datasets.push(dataSet);
						
						dataSetEstimate = {
						  label: data.fields.issuetype.name + " Estimate",
						  fill: false,
						  backgroundColor: "#fff",
						  borderColor: self.getColor(self.chartData.datasets.length),
						  data: new Array(self.workingDays.length),
						  originalData: new Array(self.workingDays.length),
						  borderDash: [5, 5],
						  workers: []
						};
						
						dataSetEstimate.data.fill(-1);
						dataSetEstimate.originalData.fill(-1);
						self.chartData.datasets.push(dataSetEstimate);
						
						self.myChart.update();
						
						if(self.resources[data.fields.issuetype.name] == undefined)
						{
							self.resources[data.fields.issuetype.name] = {};
						}
						
						self.createEstimateResources(data.fields.issuetype.name, dataSetEstimate.borderColor );
					}

					var whenClosed = -1;
                    
                    $.each([...data.changelog.histories].reverse(), function(i)
                    {
                        var date = moment(this.created);
                        
                        var index = self.workingDays.findIndex((element) => element == date.format('DD/MM/YYYY'));
                        
                        if(index > -1)
                        {
							var author = this.author;
                            $.each(this.items, function(j)
                            {
                                if(this.field == "timeestimate")
                                {
                                    var from = Math.ceil(parseInt(this.from || 0) / 3600);
                                    var to = Math.ceil(parseInt(this.to || 0) / 3600);
                                    
                                    changes.fill(0, index);
                                }
                                else if(this.field == "status" && this.to == 10706)
                                {
                                    whenClosed = index;
                                }
								
								else if(this.field == "timespent")
                                {
                                    if(dataSetEstimate.workers.findIndex(({ accountId }) => accountId == author.accountId) < 0)
									{
										dataSetEstimate.workers.push(author);
									}
                                }
                            });
                        }
                    });
                    
                    var index = self.workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
                    
                    if(index > -1)
                    {
                        changes.fill("", index + 1);
                    }
					
                    $.each(self.workingDays, function(i)
                    {
						var todayIndex = self.workingDays.findIndex(day => day === moment().format('DD/MM/YYYY'));
						if (!self.processTodayData && i >= todayIndex)
						{
							return false;
						}

                        var value = changes[i];
                        var isClosed = closedTask[i];
						dataSet.data[i] += changes[i];
						dataSetEstimate.data[i] += estimate;
						dataSetEstimate.originalData[i] += estimate;						
						
						var bgcolor = "#fff";
						
						if(whenClosed == i)
						{
							for(var j = whenClosed; j < self.workingDays.length; ++j)
							{
								dataSetBurnUp.data[j] += estimate;
							}
							
							bgcolor = "#0f0";
						}
						
                        $("<td/>", {html: value, style: "background-color: " + bgcolor }).appendTo(row);
                    });
					
					self.myChart.update();
                    
                    row.appendTo(tbody);
                }
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;

				{
					var dataSet = {
							  label: "Burn up",
							  fill: true,
							  backgroundColor: "#F5F5F5",
							  borderColor: self.getColor(self.chartData.datasets.length),
							  data: new Array(self.workingDays.length),
							  cubicInterpolationMode: 'monotone',
							  tension: 0.4,
							  order: 998,
                              hidden: true
							};
							
					dataSet.data.fill(0);
							
					self.chartData.datasets.push(dataSet);	
				}

				{
					var dataSet = {
							  label: "Burn up original",
							  fill: true,
							  backgroundColor: "#FFF",
							  borderColor: self.getColor(self.chartData.datasets.length),
							  data: new Array(self.workingDays.length),
							  cubicInterpolationMode: 'monotone',
							  tension: 0.4,
							  order: 999,
                              hidden: true
							};
							
					var total = 0;
					$.each(data.issues, function()
					{
                        total += 1
						if(this.fields.timetracking.originalEstimateSeconds)
						{
							//total += this.fields.timetracking.originalEstimateSeconds / 3600;
						}
					});
					
					var step = total / self.workingDays.length;
					
					$.each(self.workingDays, function(i)
					{
						dataSet.data[i] = step * (i+1);
					});
							
					self.chartData.datasets.push(dataSet);	
				}		
				
				data.issues = self.filterCommitmentIssues(data.issues);

                $.each(data.issues, function()
                {
                    self.onSubtask(this);
                });
				
				var dataSets = self.chartData.datasets.filter(({ label }) => label.slice(label.length-9,label.length) != " Estimate");
				
				var todayIndex = self.workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
				
				$.each(dataSets, function(j)
				{
					if(j > 1)
					{
						var maxIndex = self.processTodayData ? todayIndex + 1 : todayIndex;
						dataSets[j].data = dataSets[j].data.slice(0, maxIndex);
					}
				});
				
				self.createUserStoriesScope("User Stories", "#B0B0B0");
				self.myChart.update();
				self.computeEstimate();
				self.computeUSEstimations();				
				self.computeOffSprintHours(data.issues);        
				self.loadVisibleCharts();
				self.createInitialValues(data.issues);
				self.createGlobalChartDataSets();
            },
            enumerable: false
        },		
        filterCommitmentIssues: {
            value: function(issues)
            {
                var self = this;

				const committedUS = issues.filter(issue => 
				{
					if (issue.fields.issuetype.name === "Off-Sprint task")
					{
						return true;
					}

					var parentKey = issue.fields.parent ? issue.fields.parent.key : null;
					return parentKey && self.userStories.hasOwnProperty(parentKey);					
				});

				return committedUS;				
			},
			enumerable: false
		},
		getUSPublicId: {
			value: function(usId)
			{
				const i = usId.indexOf('-');
    			return i >= 0 ? usId.slice(i + 1) : usId;
			},
			enumerable: false
		},
        createInitialValues: {
            value: function(totalIssues)
            {
                var self = this;

				var impl = 0;
				var qa = 0;
				var auto = 0;

				$.each(totalIssues, function()
				{
					if (this.fields.issuetype.name == "Implementation Task")
						impl++;
					else if (this.fields.issuetype.name == "sub-Tarea QA")
						qa++;
					else if (this.fields.issuetype.name == "sub-Tarea Test Auto")
						auto++;
				});

				self.workingDays.unshift("START");
				self.chartData.labels.unshift("START");	

				$.each(self.chartData.datasets, function(i, dataset) {
					dataset.data.push(null);
				});

				
				function shiftDaysPatch(self, datasetName, initialValue) {
					var curr = self.chartData.datasets.find(({ label }) => label === datasetName);
					var estimate = self.chartData.datasets.find(({ label }) => label === datasetName + " Estimate");
					curr.data = [initialValue].concat(curr.data.slice(0, -1));
					if (estimate)
					estimate.data = [initialValue].concat(estimate.data.slice(0, -1));
				}

				shiftDaysPatch(self, "Implementation Task", impl);
				shiftDaysPatch(self, "sub-Tarea QA", qa);
				shiftDaysPatch(self, "sub-Tarea Test Auto", auto);
				shiftDaysPatch(self, "Off-Sprint Hours", 0);

				self.myChart.update();
			},
			enumerable: false
		},
        computeEstimate : {
            value: function()
            {
				var self = this;
				
                var dataSetsEstimate = self.chartData.datasets.filter(({ label }) => label.slice(label.length-9, label.length) == " Estimate");
				
				$.each(dataSetsEstimate, function(dataset)
				{
					this.data = [...this.originalData];
					this.counter = this.originalData[0];
                    this.numTasks = this.counter;
                    this.numResources = 0;
				});
				
				var numDays = 0;
				
				$.each(self.workingDays, function(i)
				{
					++numDays;
					
					$.each(dataSetsEstimate, function(dataset)
					{
						var resources = self.resources[this.label.slice(0, this.label.length-9)];
						
						if(resources != undefined)
						{
                            var that = this;
							
							$.each(resources, function(resource)
							{
								if(this[i] != undefined)
								{
									if(this[i].type == "full")
									{
										++that.numResources;
									}
									else if(this[i].type == "mid")
									{
										that.numResources += 0.5;
									}
								}
							});
						}
					});
				});
                
                $.each(self.workingDays, function(i)
				{
					$.each(dataSetsEstimate, function(dataset)
					{
						// if(this.label!="Implementation Task Estimate")
							// return;
						
						var resources = self.resources[this.label.slice(0, this.label.length-9)];
						
						if(resources != undefined)
						{
                            var that = this;
                            if(that.numResources > 0)
                            {
								var ratio = this.numTasks / this.numResources;
								
                                $.each(resources, function(resource)
                                {
                                    if(this[i] != undefined)
                                    {
                                        if(this[i].type == "full")
                                        {
                                            that.counter -= ratio;
                                        }
                                        else if(this[i].type == "mid")
                                        {
                                            that.counter -= (ratio * 0.5);
                                        }
                                    }
                                });
                            }
						}
						this.data[i] = this.counter;
						if(this.data[i] < 0)
							this.data[i] = 0;
					});
				});
				
				//$(".uncommited-table-container .resources").html("&nbsp;&nbsp;&nbsp;&nbsp;Resources: " + allResources/((0.5+0.5+1+1+0.2) * numDays))
				
				self.myChart.update();
            },
            enumerable: false
        },
        onLoadSettings : {
            value: function(data)
            {
                this.settings = data;
                
                var self = this;
                
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
                		
                self.presenter.getIssues(issues);
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
								max: 30,
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
        getColor : {
            value: function(i)
            {
                var colors = ["#c0c0c0", "#FAFAFA", "#1e88e5", "#90caf9", "#ffb300", "#ffd54f", "#8e24aa", "#ce93d8", "#f4511e", "#ff8a65"];
				
				if(i >= colors.length)
					return colors[0];
				else
					return colors[i];
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
							
							self.computeEstimate();
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
		computeUSEstimations: {
			value: function () {
				var self = this;

				var usEstimations = {};

				$.each(self.issues, function () 
				{
					var usKey = this.key;

					if (this.fields.subtasks && this.fields.subtasks.length > 0) 
					{
						if (!usEstimations[usKey]) 
						{
							usEstimations[usKey] = { totalTasks: 0 };
						}

						usEstimations[usKey].totalTasks = this.fields.subtasks.length;
						usEstimations[usKey].isClosed = this.fields.status.name === "Closed" ? 
							moment(this.fields.statuscategorychangedate).format("DD/MM/YYYY") : null;
					}
				});

				$.each(self.userStories, function (snowId) 
				{
					if (usEstimations[snowId]) 
					{
						self.userStories[snowId].totalTasks = usEstimations[snowId].totalTasks;
						self.userStories[snowId].isClosed = usEstimations[snowId].isClosed;
					}
					else
					{
						self.userStories[snowId].totalTasks = 0;
					}
				});

				self.updateUSChart();
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

                            self.computeUSEstimations();
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
		updateUSChart: {
			value: function () {
				var self = this;

				var usDataset = self.chartData.datasets.find(({ label }) => label === "User Stories");
				if (!usDataset) 
				{
					usDataset = 
					{
						label: "User Stories",
						data: new Array(self.workingDays.length).fill(null),
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
							formatter: function(value, context) {
								return	context.dataIndex !== 0 && context.dataset.snowIds &&
										context.dataset.snowIds[context.dataIndex]
										? context.dataset.snowIds[context.dataIndex]
										: '';
							}
						}
					};
					self.chartData.datasets.push(usDataset);
				}

				usDataset.data.fill(null);
				var additionalData = [];

				var totalTasksAllUS = 0;
				$.each(self.userStories, function (snowId) {
					totalTasksAllUS += self.userStories[snowId].totalTasks || 0;
				});

				$.each(self.userStories, function (snowId, days) 
				{
					var totalTasks = self.userStories[snowId].totalTasks || 0;
					var percentage = totalTasksAllUS > 0 ? ((totalTasks / totalTasksAllUS) * 100).toFixed(2) : 0;
					var mostRecentFullDay = -1;

					$.each(days, function (j, dayData)
					{
						if (dayData.type === "full")
						{
							mostRecentFullDay = j + 1; // + 1 because of the START label in the X axis.
						}
					});

					if (mostRecentFullDay !== -1) 
					{
						additionalData.push({
							day: mostRecentFullDay,
							percentage: parseFloat(percentage),
							snowId: snowId.replace("SNOW-", ""),
							totalTasks: totalTasks
						});
					}
				});

				additionalData.sort((a, b) => a.day - b.day);

				var cumulativePercentage = 0;
				additionalData.forEach((data, index) => 
				{
					cumulativePercentage += data.percentage;
					data.cumulativePercentage = cumulativePercentage.toFixed(2);
				});

				usDataset.data[0] = 0;
				additionalData.forEach(data => {
					usDataset.data[data.day] = parseFloat(data.cumulativePercentage); // Asigna el porcentaje acumulativo al día correspondiente
				});

				usDataset.snowIds = new Array(self.workingDays.length).fill('');
				additionalData.forEach(data => 
				{
					usDataset.snowIds[data.day] = usDataset.snowIds[data.day]
						? usDataset.snowIds[data.day] + ', ' + data.snowId
						: data.snowId;
				});

				self.myChart.update();
			},
			enumerable: false
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
				this.computeEstimate();
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
        createOffSprintHoursDataset: {
            value: function() 
			{
                var self = this;
                
                var offSprintHoursDataset = self.chartData.datasets.find(({ label }) => label === "Off-Sprint Hours");
                
                if (!offSprintHoursDataset) {
                    offSprintHoursDataset = {
                        label: "Off-Sprint Hours",
                        data: new Array(self.workingDays.length).fill(0),
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
                    
                    self.chartData.datasets.push(offSprintHoursDataset);
                }
                
                return offSprintHoursDataset;
            },
            enumerable: false
        },
		computeOffSprintHours: {
            value: function(data) 
			{
                var self = this;                
                
				var offSprintHoursDataset = self.createOffSprintHoursDataset();
                offSprintHoursDataset.data.fill(0);
                
                var todayIndex = self.workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
                offSprintHoursDataset.data = offSprintHoursDataset.data.slice(0, todayIndex + 1);

				$.each(self.workingDays, function(dayIndex, day) 
				{
                    if (todayIndex > -1 && dayIndex > todayIndex) 
					{
                        return false;
                    }
                    
                    var totalHoursForDay = 0;
                    
                    $.each(data, function(index, item) 
					{
                        if (item && item.fields && item.fields.issuetype && item.fields.issuetype.name === "Off-Sprint task") 
						{
                            var hoursForDay = self.processOffSprintSubtask(item, dayIndex);
                            totalHoursForDay += hoursForDay;
                        }
                    });
                    
                    offSprintHoursDataset.data[dayIndex] = totalHoursForDay;
                });
                
                self.myChart.update();
            },
            enumerable: false
        },
		processOffSprintSubtask: {
            value: function(subtaskData, dayIndex) 
			{
                var self = this;
        
				var hoursForDay = 0;
                var targetDay = self.workingDays[dayIndex];
        
                if (subtaskData.fields && subtaskData.fields.worklog && subtaskData.fields.worklog.worklogs) 
				{
                    $.each(subtaskData.fields.worklog.worklogs, function() 
					{
                        var worklogDate = moment(this.started);
                        var worklogDayFormatted = worklogDate.format('DD/MM/YYYY');
                        
                        if (worklogDayFormatted === targetDay) 
						{
                            var hoursWorked = this.timeSpentSeconds / 3600;
                            hoursForDay += hoursWorked;
                        }
                    });
                }
        
                return hoursForDay;
            },
            enumerable: false
        },
		createGlobalChartDataSets: {
			value: function() 
			{
				var self = this;

				// Global burndown datasets
				var burndownData = new Array(self.workingDays.length).fill(null);
				var burndownDataEstimate = new Array(self.workingDays.length).fill(null);

				const targetLabels = 
				{
					current: ["Implementation Task", "sub-Tarea QA", "sub-Tarea Test Auto"],
					estimate: ["Implementation Task Estimate", "sub-Tarea QA Estimate", "sub-Tarea Test Auto Estimate"]
				};

				$.each(self.chartData.datasets, function(i, dataset)
				{
					if (targetLabels.current.includes(dataset.label))
					{
						for (var j = 0; j < dataset.data.length; j++)
						{
							burndownData[j] += dataset.data[j];
						}
					}
					else if (targetLabels.estimate.includes(dataset.label))
					{
						for (var j = 0; j < dataset.data.length; j++)
						{
							burndownDataEstimate[j] += dataset.data[j];
						}						
					}
				});

				// Imported datasets (Off-Sprint Hours and User Stories)
				const offsprintDataSet = $.extend(true, {}, self.chartData.datasets.find(({ label }) => label === "Off-Sprint Hours"));
				offsprintDataSet.borderColor = "#7da7dfff";
				offsprintDataSet.backgroundColor = "#7da7dfff";
				offsprintDataSet.hidden = false;

				const userStoriesDataSet = $.extend(true, {}, self.chartData.datasets.find(({ label }) => label === "User Stories"));
				var userStoriesColor = "#fdb13e83";
				userStoriesDataSet.borderColor = userStoriesColor;
				userStoriesDataSet.backgroundColor = userStoriesColor;
				userStoriesDataSet.datalabels.color = userStoriesColor;
				userStoriesDataSet.datalabels.borderColor = userStoriesColor;
				userStoriesDataSet.hidden = false;

				var pointRadiusArray = new Array(userStoriesDataSet.data.length).fill(0);				
				var lastValue = 0;
				userStoriesDataSet.data.forEach((value, i, arr) =>
				{
					if (value !== null && value !== undefined && value !== 0)
					{
						pointRadiusArray[i] = 1;
						lastValue = value;
					}
					arr[i] = lastValue;
				});

				userStoriesDataSet.pointRadius = pointRadiusArray;
				userStoriesDataSet.datalabels.display = function(context) 
				{
					return context.dataset.pointRadius[context.dataIndex] > 0;
				};

				// US % dataset
				const percentagePerUS = self.chartData.datasets.find(({ label }) => label === "User Stories");
				var usCompletedDataSet = $.extend(true, {}, self.chartData.datasets.find(({ label }) => label === "User Stories"));
				usCompletedDataSet.data = new Array(percentagePerUS.data.length).fill(null);
				usCompletedDataSet.label = "% US Completed";
				usCompletedDataSet.backgroundColor = userStoriesColor;
				usCompletedDataSet.borderColor = userStoriesColor;
				usCompletedDataSet.fill = true;
				usCompletedDataSet.pointRadius = 0;
				usCompletedDataSet.borderWidth = 0;
				usCompletedDataSet.datalabels = { display: false };
				usCompletedDataSet.order = 1;
				usCompletedDataSet.hidden = false;

				var totalTasksSprint = 0;
				Object.values(self.userStories).forEach(value => {
					totalTasksSprint += value.totalTasks || 0;
				});

				$.each(self.userStories, function(snowId)
				{
					const usData = self.userStories[snowId];
					if (usData.isClosed)
					{
						const dayIndex = self.workingDays.findIndex(day => day === usData.isClosed);
						usCompletedDataSet.data[dayIndex] = (usData.totalTasks / totalTasksSprint) * 100;
					}
				});

				const todayIndex = self.workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
				lastValue = 0;
				usCompletedDataSet.data.forEach((value, i, arr) => {
					if (i > todayIndex) return;

					if (value !== null && value !== undefined)
					{
						lastValue += value;
					}
					arr[i] = lastValue;
				});
				
				var datasets = [
					{
						label: "Burndown",
						data: burndownData,
						backgroundColor: "#288a01ff",
						borderColor: "#288a01ff",
						fill: false,
						tension: 0.4,
						cubicInterpolationMode: 'monotone',
						order: 1000,
						hidden: false
					},
					{
						label: "Burndown Estimate",
						data: burndownDataEstimate,
						backgroundColor: "#ca1818ff",
						borderColor: "#ca1818ff",
						fill: false,
						tension: 0.4,
						borderDash: [5, 5],
						cubicInterpolationMode: 'monotone',
						order: 1000,
						hidden: false
					},
					offsprintDataSet,
					userStoriesDataSet,
					usCompletedDataSet
				];

				self.backupDatasets.push(...datasets);
			},
			enumerable: false
		}
	});

    views.BurndownView = BurndownView;
})(viewer.views);