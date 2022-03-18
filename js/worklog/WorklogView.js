(function(views)
{
	var self;

    function WorklogView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(WorklogView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.issues = [];
                
				$(document).on("board", function (evt, data)
                {
                    self.board = data;
                });
				
                $(document).on("login", function ()
                {   
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Worklog"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
						self.presenter.getSettings();
						
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
				
						$(".main-view").load("js/worklog/template.html", function()
						{
							self.progress = $(".worklog-table-container .loading")[0];
							
							componentHandler.upgradeElement(self.progress);
							
							self.progress.MaterialProgress.setProgress(0);
							
							$('#fromCalendar').datepicker(
							{
								dateFormat: 'yy-mm-dd',
								showButtonPanel: true,
								changeMonth: true,
								changeYear: true,
								defaultDate: +0,
								showAnim: "fold",
								onSelect: function(dateText)
								{
									self.search();
								}
							});
							
							$('#toCalendar').datepicker(
							{
								dateFormat: 'yy-mm-dd',
								showButtonPanel: true,
								changeMonth: true,
								changeYear: true,
								defaultDate: +0,
								showAnim: "fold",
								onSelect: function(dateText)
								{
									self.search();
								}
							});
						});
                    });
                });
            },
            enumerable: false
        },
        commit : {
            value: function(data)
            {
                var self = this;
                
                this.settings.projects = [];
				
                $.each($(this.dialog).find(".body .context-menu-item.active"), function()
                {
                    self.settings.projects.push($(this).find(".status_id").text());
                });
				
                this.presenter.setSetting("projects", this.settings.projects);
            },
            enumerable: false
        },
		search : {
            value: function()
            {
                $.xhrPool.abortAll();
		
				$("#usersContainer").html("");
			
				var fromRaw = $('#fromCalendar').datepicker({ dateFormat: 'dd/mm/yy' }).val();
				var toRaw = $('#toCalendar').datepicker({ dateFormat: 'dd/mm/yy' }).val();
				
				this.users = new Array();
				this.count = 0;
				this.progress.MaterialProgress.setProgress(0);
				
				this.presenter.getIssues(this.settings.projects, fromRaw, toRaw);
            },
            enumerable: false
        },
        onProjects : {
            value: function(data)
            {
				var self = this;
				
				var projects = this.template.find(".body");
                    
				$.each(data, function()
				{
					var clone = self.projectsTemplate.clone();
					clone.html("<img class='icon' src='" + this.avatarUrls["24x24"] + "'/><span class='status_id'>" + this.id +"</span>" + this.name);
					
					var id = this.key;
					var name = this.name;
					
					clone.click(function()
					{
						$(this).toggleClass("active");
                        var cnt = self.dialog.find(".body .context-menu-item.active").length;
						self.dialog.find(".selection").html(cnt + " elements selected");
					}).appendTo(projects);
				});
            },
            enumerable: false
        },
        onLoadSettings : {
            value: function(data)
            {
				var self = this;
				
                this.settings = data;
				
				if(this.settings.projects == undefined)
				{
					$(".modal-dialog").load("js/worklog/projects.html", function()
					{
						self.template = $(this);
						
						self.projectsTemplate = self.template.find(".body li").detach();
						
						self.dialog = $(this).find(".project-dialog");
						
						self.dialog.find(".mdl-button.close").click(function()
						{
							self.dialog[0].close();
						});
						
						self.dialog.find(".mdl-button.confirm").click(function()
						{
							self.commit();
						});
					   
						self.dialog[0].showModal();
						
						self.presenter.getProjects();
					});
				}
            },
            enumerable: false
        },
        onSaveSetting : {
            value: function(data)
            {
                //this.changeBoard(data.board.id, data.board.name);
                this.dialog[0].close();
            },
            enumerable: false
        },
		sleep : {
            value: function(ms)
            {
				return new Promise(resolve => setTimeout(resolve, ms));
            },
            enumerable: false
        },
		onIssues : {
            value: function(data)
            {
				var self = this;
				
				this.count += data.issues.length;
				
				$.each( data.issues, function( key, value )
				{
					$.each( value.fields.worklog.worklogs, function( key2, value2 )
					{
						var author = value2.author.accountId;
					
						if(self.users[author] == undefined)
						{
							self.users[author] = {"counter": {"original": 0, "current": 0}};
							
							$("#usersContainer").append(self.createCard(author, value2.author.avatarUrls["48x48"], 
																				value2.author.displayName));
						}
						
						self.updateUser(author, value.fields.project.key, value2.timeSpentSeconds);
					});
				});
				
				self.progress.MaterialProgress.setProgress((this.count/data.total)*100);
            },
            enumerable: false
        },
		updateUser : {
            value: function(author, project, seconds)
            {
                if(this.users[author][project] == undefined)
				{
					this.users[author][project] = seconds;
					var content = "<div class='mdl-card__actions mdl-card--border " + project + "'>" + project +"<div class='mdl-layout-spacer'></div><span></span></div>";
					
					$("#" + author).append(content);
				}
				else
				{
					this.users[author][project] += seconds;
				}
				
				this.users[author].counter.current++;
				
				var formatted = this.formatTime(this.users[author][project]);
				
				$("#" + author + " ." + project + " span").html(formatted);
            },
            enumerable: false
        },
		formatTime : {
            value: function(time)
            {
                var hours = Math.floor(time / 3600);
				time = time - hours * 3600;
				
				var minutes = Math.floor(time / 60);
				var seconds = time - minutes * 60;
				
				return hours + ':' + this.str_pad_left(minutes, '0', 2) + ':' + this.str_pad_left(seconds, '0', 2);
            },
            enumerable: false
        },
		str_pad_left : {
            value: function(string,pad,length)
            {
                return (new Array(length+1).join(pad)+string).slice(-length);
            },
            enumerable: false
        },
		createCard : {
            value: function(user, image, displayName)
            {
                return "<li id= '" + user + "' class='demo-card-event mdl-card mdl-shadow--2dp'>" + 
						"  <div class='mdl-card__title mdl-card--expand'><h5>" + displayName +
						"		</h5><img src='" + image + "'/>" + 
						"  </div>" + 
						"</li>";
            },
            enumerable: false
        },
		showError : {
            value: function(jqxhr, textStatus, error)
            {
                showError(jqxhr, textStatus, error);
            },
            enumerable: false
        }
    });

    views.WorklogView = WorklogView;
})(viewer.views);