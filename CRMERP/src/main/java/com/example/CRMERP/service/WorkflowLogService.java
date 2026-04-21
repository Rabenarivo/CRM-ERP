package com.example.CRMERP.service;

import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.repository.WorkflowLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WorkflowLogService {
    private final WorkflowLogRepository repoworkflow;
    
    public WorkflowLogService(WorkflowLogRepository repo) {
        this.repoworkflow = repo;
    }

    public List<WorkflowLog> findAll() {
        return repoworkflow.findAllByOrderByDateActionDesc();
    }

    public WorkflowLog save(WorkflowLog w) {
        return repoworkflow.save(w);
    }

}
