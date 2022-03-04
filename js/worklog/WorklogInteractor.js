(function(interactors)
{
    function WorklogInteractor()
    {
        
    }

    Object.defineProperties(WorklogInteractor.prototype,
    {
        getIssue : {
            value: function(key, listener)
            {
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/issue/" + key + "",
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
            value: function(issues, projects, listener, startAt = 0)
            {
                var self = this;
                
                var pagination = 100;
                
                $.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/search/?jql=project in (" + projects.toString() + ") and id in (" + issues.toString() + ")+order+by+updated&fields=project&maxResults=" + pagination + "&startAt=" + startAt,
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
                        listener.onSuccess(json);
                        
                        if(json.startAt + pagination <= json.total)
                        {
                            self.getIssues(issues, projects, listener, json.startAt + pagination);
                        }
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr, textStatus, error);
                        }
					}
				});
            },
            enumerable: false
        },
        getWorklog : {
            value: function(fromRaw, toRaw, listener)
            {
                var self = this;
				
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/worklog/updated?since=" + fromRaw + "&until=" + toRaw,
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
        getWorklogList : {
            value: function(ids, listener)
            {
                var self = this;
				
				$.ajax
				({
					type: "POST",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/worklog/list",
					data: JSON.stringify({"ids":ids}),
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Content-Type", "application/json;odata=verbose"); 
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
        }
    });

    interactors.WorklogInteractor = WorklogInteractor;
})(viewer.interactors);