"use strict";require("./utils.js");'use strict';global.tr.exportTo('tr.b',function(){var ESTIMATED_IDLE_PERIOD_LENGTH_MILLISECONDS=10;var REQUEST_IDLE_CALLBACK_TIMEOUT_MILLISECONDS=100;var recordRAFStacks=false;var pendingPreAFs=[];var pendingRAFs=[];var pendingIdleCallbacks=[];var currentRAFDispatchList=undefined;var rafScheduled=false;var idleWorkScheduled=false;function scheduleRAF(){if(rafScheduled)return;rafScheduled=true;if(tr.isHeadless){Promise.resolve().then(function(){processRequests(false,0);},function(e){console.log(e.stack);throw e;});}else{if(window.requestAnimationFrame){window.requestAnimationFrame(processRequests.bind(this,false));}else{var delta=Date.now()-window.performance.now();window.webkitRequestAnimationFrame(function(domTimeStamp){processRequests(false,domTimeStamp-delta);});}}}function nativeRequestIdleCallbackSupported(){return!tr.isHeadless&&window.requestIdleCallback;}function scheduleIdleWork(){if(idleWorkScheduled)return;if(!nativeRequestIdleCallbackSupported()){scheduleRAF();return;}idleWorkScheduled=true;window.requestIdleCallback(function(deadline,didTimeout){processIdleWork(false,deadline);},{timeout:REQUEST_IDLE_CALLBACK_TIMEOUT_MILLISECONDS});}function onAnimationFrameError(e,opt_stack){console.log(e.stack);if(tr.isHeadless)throw e;if(opt_stack)console.log(opt_stack);if(e.message)console.assert(true,e.message,e.stack);else console.assert(true,e);}function runTask(task,frameBeginTime){try{task.callback.call(task.context,frameBeginTime);}catch(e){tr.b.onAnimationFrameError(e,task.stack);}}function processRequests(forceAllTasksToRun,frameBeginTime){rafScheduled=false;var currentPreAFs=pendingPreAFs;currentRAFDispatchList=pendingRAFs;pendingPreAFs=[];pendingRAFs=[];var hasRAFTasks=currentPreAFs.length||currentRAFDispatchList.length;for(var i=0;i<currentPreAFs.length;i++)runTask(currentPreAFs[i],frameBeginTime);while(currentRAFDispatchList.length>0)runTask(currentRAFDispatchList.shift(),frameBeginTime);currentRAFDispatchList=undefined;if(!hasRAFTasks&&!nativeRequestIdleCallbackSupported()||forceAllTasksToRun){var rafCompletionDeadline=frameBeginTime+ESTIMATED_IDLE_PERIOD_LENGTH_MILLISECONDS;processIdleWork(forceAllTasksToRun,{timeRemaining:function(){return rafCompletionDeadline-window.performance.now();}});}if(pendingIdleCallbacks.length>0)scheduleIdleWork();}function processIdleWork(forceAllTasksToRun,deadline){idleWorkScheduled=false;while(pendingIdleCallbacks.length>0){runTask(pendingIdleCallbacks.shift());if(!forceAllTasksToRun&&(tr.isHeadless||deadline.timeRemaining()<=0)){break;}}if(pendingIdleCallbacks.length>0)scheduleIdleWork();}function getStack_(){if(!recordRAFStacks)return'';var stackLines=tr.b.stackTrace();stackLines.shift();return stackLines.join('\n');}function requestPreAnimationFrame(callback,opt_this){pendingPreAFs.push({callback:callback,context:opt_this||global,stack:getStack_()});scheduleRAF();}function requestAnimationFrameInThisFrameIfPossible(callback,opt_this){if(!currentRAFDispatchList){requestAnimationFrame(callback,opt_this);return;}currentRAFDispatchList.push({callback:callback,context:opt_this||global,stack:getStack_()});return;}function requestAnimationFrame(callback,opt_this){pendingRAFs.push({callback:callback,context:opt_this||global,stack:getStack_()});scheduleRAF();}function requestIdleCallback(callback,opt_this){pendingIdleCallbacks.push({callback:callback,context:opt_this||global,stack:getStack_()});scheduleIdleWork();}function forcePendingRAFTasksToRun(frameBeginTime){if(!rafScheduled)return;processRequests(false,frameBeginTime);}function forceAllPendingTasksToRunForTest(){if(!rafScheduled&&!idleWorkScheduled)return;processRequests(true,0);}return{onAnimationFrameError:onAnimationFrameError,requestPreAnimationFrame:requestPreAnimationFrame,requestAnimationFrame:requestAnimationFrame,requestAnimationFrameInThisFrameIfPossible:requestAnimationFrameInThisFrameIfPossible,requestIdleCallback:requestIdleCallback,forcePendingRAFTasksToRun:forcePendingRAFTasksToRun,forceAllPendingTasksToRunForTest:forceAllPendingTasksToRunForTest};});