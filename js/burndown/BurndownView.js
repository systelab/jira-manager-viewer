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
						dataSets[j].data = dataSets[j].data.slice(0, todayIndex + 1);
					}
				});
				
				self.myChart.update();
				
				self.computeEstimate();
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
            value: function()
            {
                const DATA_COUNT = 7;
				const NUMBER_CFG = {count: DATA_COUNT, min: -100, max: 100};

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
					  }
					}
				  },
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
        onLoad : {
            value: function(data)
            {
				this.resources = data;
				
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
				this.presenter.save(this.board.name, this.sprint.name, this.resources);
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
        }
    });

    views.BurndownView = BurndownView;
})(viewer.views);