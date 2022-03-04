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
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
				
						$(".main-view").load("js/worklog/template.html", function()
						{
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
		search : {
            value: function()
            {
                $.xhrPool.abortAll();
		
				$("#usersContainer").html("");
			
				var fromRaw = $('#fromCalendar').datepicker("getDate");
				var toRaw = $('#toCalendar').datepicker("getDate");
				
				this.presenter.getWorklog(fromRaw.getTime(), toRaw.getTime());
            },
            enumerable: false
        },
		onWorklog : {
            value: function(data)
            {
                var ids = [];
				
				$.each( data.values, function( key, value )
				{
					if(value.updatedTime < $('#toCalendar').datepicker("getDate").getTime())
					{
						ids.push(value.worklogId);
					}
				});
				
				if(ids.length > 0)
				{
					this.presenter.getWorklogList(ids);
				}
            },
            enumerable: false
        },
		onWorklogList : {
            value: function(data)
            {
				this.worklogs = data;
				
				var issues = [];
				
                $.each( data, function( key, value )
				{
					issues.push(value.issueId);
				});
				
				var project = (this.board.name.substring(0, this.board.name.indexOf("_")));
				
				this.presenter.getIssues(issues, [project]);
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
				
				var users = new Array();
				
				$.each( this.worklogs, function( key, value )
				{
					if(data.issues.find( issue => issue.id === value.issueId ) != undefined)
					{
						var author = value.author.accountId;
					
						if(users[author] == undefined)
						{
							users[author] = {"counter": {"original": 0, "current": 0}, "seconds": 0};
							
							$("#usersContainer").append(self.createCard(author, value.author.avatarUrls["48x48"], value.author.displayName));
							
							var progress = $("#" + author + " .loading")[0];
							
							componentHandler.upgradeElement(progress);
							
							progress.MaterialProgress.setProgress(0);
						}
						
						users[author].counter.original++;
						users[author].seconds += value.timeSpentSeconds;
						
						$("#" + author + " .mdl-card--border span").html(self.formatTime(users[author].seconds));
				
					}
				});
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
						"<div class='mdl-progress mdl-js-progress loading'></div>" +
						"  <div class='mdl-card__title mdl-card--expand'><h5>" + displayName +
						"		</h5><img src='" + image + "'/>" + 
						"  </div>" + 
						"<div class='mdl-card__actions mdl-card--border'><div class='mdl-layout-spacer'></div><span></span></div>" + 
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