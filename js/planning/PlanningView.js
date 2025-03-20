(function(views)
{
    var self;

    function PlanningView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(PlanningView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.issues = [];
                
                $(".playlists-list").on("loaded", function (evt, data)
                {             
                    self.issues = data.issues;
                });
				
				$(document).on("sprint", function (evt, data)
                {             
                    self.sprint = data;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Planning"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                
                        self.presenter.getSettings();
                    });
                });
            },
            enumerable: false
        },
        onSubtask : {
            value: function(data)
            {
                var self = this;
                
                if(data.fields.timetracking.originalEstimateSeconds > 0)
                {
                    var table = $("table.planning");
                    
                    var tbody = table.find("#" + data.fields.parent.key);
                    
                    if(tbody.length == 0)
                    {
                        tbody = $("<tbody/>", {id: data.fields.parent.key});
                        tbody.appendTo(table);
                    }
                
                    var row = $("<tr/>");
                    
                    $("<td/>", {html: data.fields.parent.key}).appendTo(row);
                    $("<td/>", {html: data.fields.issuetype.name[0]}).appendTo(row);
                    $("<td/>", {html: data.key}).appendTo(row);
                    $("<td/>", {html: data.fields.summary}).appendTo(row);
                    $("<td/>", {html: data.fields.timetracking.originalEstimateSeconds / 3600}).appendTo(row);
                    $("<td/>", {html: ""}).appendTo(row);
                   
                    for(var i = 0; i < self.workingDays.length; ++i)
                    {
                        $("<td/>", {html: ""}).appendTo(row);
                    }
                    
                    row.appendTo(tbody);
                }
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;
                
                $.each(data.issues, function()
                {
                    self.onSubtask(this);
                });
                
                this.progress.hide();
            },
            enumerable: false
        },
        onLoadSettings : {
            value: function(data)
            {
                this.settings = data;
                
                var self = this;
                
                $(".main-view").load("js/planning/template.html", function()
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
                
				this.initCharts();
				
                self.workingDays = self.calcBusinessDays(self.sprint.startDate, self.sprint.endDate);
                        
				var table = $("table.planning");
				
				$.each(self.issues, function()
				{
					var row = $("<tr/>");
					$("<td/>", {html: this.key}).appendTo(row);
					$("<td/>", {html: this.fields.summary}).appendTo(row);
					$("<td/>", {html: this.fields.customfield_10003}).appendTo(row);
					$("<td/>", {html: this.fields.customfield_14355 ? this.fields.customfield_14355.value : ""}).appendTo(row);
					$("<td/>", {html: this.fields.status.name}).appendTo(row);
					
					row.appendTo(table);
				});
				
				table = $("table.yield");
				
				$.each(self.issues, function()
				{
					if(this.fields.customfield_14355 && this.fields.customfield_14355.value == "Closed")
					{
						var row = $("<tr/>");
						$("<td/>", {html: this.key}).appendTo(row);
						$("<td/>", {html: this.fields.summary}).appendTo(row);
						$("<td/>", {html: ""}).appendTo(row);
						$("<td/>", {html: this.fields.customfield_10003}).appendTo(row);
						$("<td/>", {html: ""}).appendTo(row);
						$("<td/>", {html: this.fields.customfield_10003}).appendTo(row);
						$("<td/>", {html: Math.round(this.fields.aggregatetimeoriginalestimate/ 3600)}).appendTo(row);
						$("<td/>", {html: ""}).appendTo(row);
						$("<td/>", {html: Math.round(this.fields.aggregatetimespent/ 3600)}).appendTo(row);
						row.appendTo(table);
					}
				});
				
				const effortByUserStoryChartData = self.effortByUserStoryChart.data;
				const effortByUserStoryTypeChartData = self.effortByUserStoryTypeChart.data;
				
				table = $("table.percent");
				
				$.each(self.issues, function()
				{
					var timeSpent = Math.round(this.fields.aggregatetimespent/ 3600);
					
					var row = $("<tr/>");
					$("<td/>", {html: this.key}).appendTo(row);
					$("<td/>", {html: this.fields.summary}).appendTo(row);
					$("<td/>", {html: timeSpent}).appendTo(row);
					$("<td/>", {html: ""}).appendTo(row);

					row.appendTo(table);
					
					effortByUserStoryChartData.labels.push(this.key + ": " + this.fields.summary);
					effortByUserStoryChartData.datasets[0].data.push(timeSpent);
					
					var sum = 0;
					
					$.each(table.find("td:nth-child(3)"), function()
					{
						sum += parseInt($(this).text());
					});
					
					if(sum > 0)
					{
						$.each(table.find("td:nth-child(4)"), function()
						{
							$(this).html(round((parseInt($(this).prev().text()) / sum) * 100, 2) + "%");
						});
					}
					
					var labelIndex = -1;
			
					for (let index = 0; index < effortByUserStoryTypeChartData.labels.length; ++index)
					{
						if(effortByUserStoryTypeChartData.labels[index] == this.fields.issuetype.name)
						{
							labelIndex = index;
							break;
						}
					}
					
					if(labelIndex > -1)
					{
						effortByUserStoryTypeChartData.datasets[0].data[labelIndex] += timeSpent;
					}
					else
					{
						effortByUserStoryTypeChartData.labels.push(this.fields.issuetype.name);
						effortByUserStoryTypeChartData.datasets[0].data.push(timeSpent);
					}
				});
				
				self.effortByUserStoryChart.update();
				self.effortByUserStoryTypeChart.update();
            },
            enumerable: false
        },
        initCharts : {
            value: function(data)
            {
				this.effortByUserStoryChart = new Chart(document.getElementById('effortByUserStoryChart').getContext('2d'), {
					type: 'pie',
					data: {
						labels: [],
						datasets: [{
							data: [],
							label: 'effort by user story',
							borderWidth: 1,
							backgroundColor: [
                                'rgba(255, 0, 0, 0.2)',    // Rojo
                                'rgba(0, 255, 0, 0.2)',    // Verde
                                'rgba(0, 0, 255, 0.2)',    // Azul
                                'rgba(255, 255, 0, 0.2)',  // Amarillo
                                'rgba(255, 0, 255, 0.2)',  // Magenta
                                'rgba(0, 255, 255, 0.2)',  // Cian
                                'rgba(128, 0, 0, 0.2)',    // Rojo Oscuro
                                'rgba(0, 128, 0, 0.2)',    // Verde Oscuro
                                'rgba(0, 0, 128, 0.2)',    // Azul Oscuro
                                'rgba(128, 128, 0, 0.2)',  // Oliva
                                'rgba(128, 0, 128, 0.2)',  // Púrpura
                                'rgba(0, 128, 128, 0.2)',  // Verde Azulado
                                'rgba(255, 165, 0, 0.2)',  // Naranja
                                'rgba(75, 0, 130, 0.2)',   // Índigo
                                'rgba(139, 69, 19, 0.2)',  // Marrón
                                'rgba(255, 20, 147, 0.2)', // Rosa
                                'rgba(47, 79, 79, 0.2)',   // Gris Oscuro
                                'rgba(210, 105, 30, 0.2)', // Chocolate
                                'rgba(154, 205, 50, 0.2)', // Amarillo Verdoso
                                'rgba(70, 130, 180, 0.2)'  // Azul Acero
                            ],

                            borderColor: [
                                'rgba(255, 0, 0, 1)',    // Rojo
                                'rgba(0, 255, 0, 1)',    // Verde
                                'rgba(0, 0, 255, 1)',    // Azul
                                'rgba(255, 255, 0, 1)',  // Amarillo
                                'rgba(255, 0, 255, 1)',  // Magenta
                                'rgba(0, 255, 255, 1)',  // Cian
                                'rgba(128, 0, 0, 1)',    // Rojo Oscuro
                                'rgba(0, 128, 0, 1)',    // Verde Oscuro
                                'rgba(0, 0, 128, 1)',    // Azul Oscuro
                                'rgba(128, 128, 0, 1)',  // Oliva
                                'rgba(128, 0, 128, 1)',  // Púrpura
                                'rgba(0, 128, 128, 1)',  // Verde Azulado
                                'rgba(255, 165, 0, 1)',  // Naranja
                                'rgba(75, 0, 130, 1)',   // Índigo
                                'rgba(139, 69, 19, 1)',  // Marrón
                                'rgba(255, 20, 147, 1)', // Rosa
                                'rgba(47, 79, 79, 1)',   // Gris Oscuro
                                'rgba(210, 105, 30, 1)', // Chocolate
                                'rgba(154, 205, 50, 1)', // Amarillo Verdoso
                                'rgba(70, 130, 180, 1)'  // Azul Acero
                            ]
						}]
					},
					options: {
						responsive: true,
						plugins: {
						  title: {
							display: true,
							text: 'Effort by US'
						  }
						}
					}
				});
				
				this.effortByUserStoryTypeChart = new Chart(document.getElementById('effortByUserStoryTypeChart').getContext('2d'), {
					type: 'pie',
					data: {
						labels: [],
						datasets: [{
							data: [],
							label: 'effort by user story type',
							borderWidth: 1,
							backgroundColor: [
                                'rgba(255, 0, 0, 0.2)',    // Rojo
                                'rgba(0, 255, 0, 0.2)',    // Verde
                                'rgba(0, 0, 255, 0.2)',    // Azul
                                'rgba(255, 255, 0, 0.2)',  // Amarillo
                                'rgba(255, 0, 255, 0.2)',  // Magenta
                                'rgba(0, 255, 255, 0.2)',  // Cian
                                'rgba(128, 0, 0, 0.2)',    // Rojo Oscuro
                                'rgba(0, 128, 0, 0.2)',    // Verde Oscuro
                                'rgba(0, 0, 128, 0.2)',    // Azul Oscuro
                                'rgba(128, 128, 0, 0.2)',  // Oliva
                                'rgba(128, 0, 128, 0.2)',  // Púrpura
                                'rgba(0, 128, 128, 0.2)',  // Verde Azulado
                                'rgba(255, 165, 0, 0.2)',  // Naranja
                                'rgba(75, 0, 130, 0.2)',   // Índigo
                                'rgba(139, 69, 19, 0.2)',  // Marrón
                                'rgba(255, 20, 147, 0.2)', // Rosa
                                'rgba(47, 79, 79, 0.2)',   // Gris Oscuro
                                'rgba(210, 105, 30, 0.2)', // Chocolate
                                'rgba(154, 205, 50, 0.2)', // Amarillo Verdoso
                                'rgba(70, 130, 180, 0.2)'  // Azul Acero
                            ],

                            borderColor: [
                                'rgba(255, 0, 0, 1)',    // Rojo
                                'rgba(0, 255, 0, 1)',    // Verde
                                'rgba(0, 0, 255, 1)',    // Azul
                                'rgba(255, 255, 0, 1)',  // Amarillo
                                'rgba(255, 0, 255, 1)',  // Magenta
                                'rgba(0, 255, 255, 1)',  // Cian
                                'rgba(128, 0, 0, 1)',    // Rojo Oscuro
                                'rgba(0, 128, 0, 1)',    // Verde Oscuro
                                'rgba(0, 0, 128, 1)',    // Azul Oscuro
                                'rgba(128, 128, 0, 1)',  // Oliva
                                'rgba(128, 0, 128, 1)',  // Púrpura
                                'rgba(0, 128, 128, 1)',  // Verde Azulado
                                'rgba(255, 165, 0, 1)',  // Naranja
                                'rgba(75, 0, 130, 1)',   // Índigo
                                'rgba(139, 69, 19, 1)',  // Marrón
                                'rgba(255, 20, 147, 1)', // Rosa
                                'rgba(47, 79, 79, 1)',   // Gris Oscuro
                                'rgba(210, 105, 30, 1)', // Chocolate
                                'rgba(154, 205, 50, 1)', // Amarillo Verdoso
                                'rgba(70, 130, 180, 1)'  // Azul Acero
                            ]
						}]
					},
					options: {
						responsive: false,
						plugins: {
						  title: {
							display: true,
							text: 'Effort by US type'
						  },
                          legend: {
                                display: false
                            },
                          datalabels: {
                            display: "auto",
                            align: 'end',
                            backgroundColor: '#F2F2F2',
                            borderRadius: 3,
                            font: {
                              size: 12,
                            },
                            formatter: function(value, context) {
                              return context.chart.data.labels[context.dataIndex] + ': ' + Math.round(value) + 'h';
                            }
                          }
						}
					}
				});
            },
            enumerable: false
        },
        showError : {
            value: function(data)
            {
                showError(data);
            },
            enumerable: false
        }
    });

    views.PlanningView = PlanningView;
})(viewer.views);