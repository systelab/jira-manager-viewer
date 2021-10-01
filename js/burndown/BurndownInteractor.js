(function(interactors)
{
    function BurndownInteractor()
    {
        
    }

    Object.defineProperties(BurndownInteractor.prototype,
    {
        getIssue : {
            value: function(key, listener)
            {
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/issue/" + key + "?fields=subtasks&expand=changelog",
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
                        if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        },
        getIssues : {
            value: function(issues, listener, startAt = 0)
            {
                var self = this;
                
                var pagination = 1000;
                
                $.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/search/?jql=parent in (" + issues.toString() + ")+order+by+updated&fields=assignee,status,parent,summary,issuetype,timetracking&maxResults=" + pagination + "&startAt=" + startAt+"&expand=changelog",
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
                        listener.onSuccess(json);
                        
                        if(json.startAt + pagination <= json.total)
                        {
                            self.getIssues(issues, listener, json.startAt + pagination);
                        }
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        },
        getWorklogList : {
            value: function(ids, listener)
            {
				$.ajax
				({
					type: "POST",
                    crossDomain: true,
                    dataType: 'json',
                    data: JSON.stringify({"ids":ids}),
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/worklog/list",
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        xhr.setRequestHeader("Content-Type", "application/json;odata=verbose");
					},
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        },
        getWorklogModified : {
            value: function(beginDate, endDate, listener)
            {
                var self = this;
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/worklog/updated?since=" + beginDate + "&until=" + endDate,
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
						listener.onSuccess(json);
                        
                        if(!json.lastPage)
                        {
                            self.getWorklogPage(json.nextPage, listener);
                        }
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        },
    });

    interactors.BurndownInteractor = BurndownInteractor;
})(viewer.interactors);