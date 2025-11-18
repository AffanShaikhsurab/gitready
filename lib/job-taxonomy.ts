export type Level = 'Fresher' | 'Junior' | 'Mid' | 'Senior'
export type Domain = 'Front Web' | 'Android' | 'AI/ML' | 'DevOps' | 'Game Dev' | 'Backend' | 'Fullstack' | 'Data Science' | 'iOS'

export interface JobRequirementSet {
  domain: Domain
  level: Level
  requirements: {
    skills: string[]
    frameworks: string[]
    deliverables: string[]
    patterns: string[]
  }
}

const TAXONOMY: JobRequirementSet[] = [
  {
    domain: 'Front Web',
    level: 'Fresher',
    requirements: {
      skills: ['HTML', 'CSS', 'JavaScript', 'Git', 'Responsive design', 'Basic testing'],
      frameworks: ['React', 'Vue', 'Tailwind CSS', 'Bootstrap'],
      deliverables: ['README', 'Screenshots', 'Deployment to Vercel/Netlify'],
      patterns: ['Component composition', 'State basics', 'Accessibility basics']
    }
  },
  {
    domain: 'Front Web',
    level: 'Junior',
    requirements: {
      skills: ['TypeScript', 'Accessibility', 'Unit testing', 'Version control'],
      frameworks: ['React', 'Next.js', 'Redux', 'Zustand'],
      deliverables: ['CI pipeline', 'E2E tests'],
      patterns: ['Hooks', 'Routing', 'Code splitting']
    }
  },
  {
    domain: 'Front Web',
    level: 'Mid',
    requirements: {
      skills: ['Performance profiling', 'Accessibility AA', 'Advanced testing'],
      frameworks: ['Next.js App Router', 'SSR', 'SSG'],
      deliverables: ['Design system', 'Docs site'],
      patterns: ['Atomic design', 'Error boundaries', 'State management patterns']
    }
  },
  {
    domain: 'Front Web',
    level: 'Senior',
    requirements: {
      skills: ['Architecture', 'Observability', 'Security basics', 'Leadership'],
      frameworks: ['Next.js', 'Microfrontends (optional)'],
      deliverables: ['Tech debt plan', 'Performance budgets'],
      patterns: ['Monorepo', 'Module federation', 'Scalable state management']
    }
  },
  {
    domain: 'Android',
    level: 'Fresher',
    requirements: {
      skills: ['Kotlin basics', 'Android SDK', 'Git', 'Activities/Fragments'],
      frameworks: ['Jetpack'],
      deliverables: ['Screenshots', 'Simple apps', 'Play Store beta (optional)'],
      patterns: ['MVVM basics', 'Navigation basics']
    }
  },
  {
    domain: 'Android',
    level: 'Junior',
    requirements: {
      skills: ['Coroutines', 'Room', 'Retrofit', 'DataStore', 'Unit/UI testing'],
      frameworks: ['Jetpack Compose', 'Hilt'],
      deliverables: ['Gradle CI', 'Test suites'],
      patterns: ['Clean architecture', 'Lifecycle-aware patterns']
    }
  },
  {
    domain: 'Android',
    level: 'Mid',
    requirements: {
      skills: ['Modularization', 'DI', 'Flow/StateFlow', 'Performance tuning'],
      frameworks: ['Compose', 'Hilt/Dagger', 'RxJava (optional)'],
      deliverables: ['CI/CD', 'Crash monitoring'],
      patterns: ['Layered architecture', 'Repository pattern']
    }
  },
  {
    domain: 'Android',
    level: 'Senior',
    requirements: {
      skills: ['Architecture leadership', 'Scalability', 'Mentoring'],
      frameworks: ['Compose', 'Kotlin Multiplatform (optional)'],
      deliverables: ['Scalable architecture', 'Performance optimization'],
      patterns: ['Modular monolith', 'Feature modules']
    }
  },
  {
    domain: 'AI/ML',
    level: 'Fresher',
    requirements: {
      skills: ['Python', 'NumPy', 'Pandas', 'Statistics basics'],
      frameworks: ['scikit-learn'],
      deliverables: ['Notebook report', 'README with metrics'],
      patterns: ['Train/val/test split', 'Baseline models']
    }
  },
  {
    domain: 'AI/ML',
    level: 'Junior',
    requirements: {
      skills: ['Feature engineering', 'Model evaluation', 'APIs', 'Docker'],
      frameworks: ['PyTorch', 'TensorFlow', 'FastAPI'],
      deliverables: ['Model card', 'Serving API'],
      patterns: ['Experiment tracking', 'Model versioning']
    }
  },
  {
    domain: 'AI/ML',
    level: 'Mid',
    requirements: {
      skills: ['Cloud deployment', 'MLOps', 'CI/CD for ML', 'Pipelines'],
      frameworks: ['TensorFlow', 'PyTorch', 'MLflow'],
      deliverables: ['Data pipelines', 'Monitoring'],
      patterns: ['Retraining', 'Data versioning']
    }
  },
  {
    domain: 'AI/ML',
    level: 'Senior',
    requirements: {
      skills: ['LLM/RAG', 'Distributed training', 'Leadership'],
      frameworks: ['HuggingFace', 'TensorFlow', 'PyTorch'],
      deliverables: ['Scalable ML systems', 'SLOs'],
      patterns: ['Streaming inference', 'Online learning']
    }
  },
  {
    domain: 'DevOps',
    level: 'Fresher',
    requirements: {
      skills: ['Linux basics', 'Git', 'CI', 'Scripting'],
      frameworks: ['Docker'],
      deliverables: ['CI pipeline', 'Containerized app'],
      patterns: ['Branching strategy', 'Basic pipelines']
    }
  },
  {
    domain: 'DevOps',
    level: 'Junior',
    requirements: {
      skills: ['Kubernetes basics', 'Monitoring', 'Terraform/Ansible'],
      frameworks: ['GitHub Actions', 'Jenkins', 'Helm'],
      deliverables: ['Deploy pipeline', 'Dashboards'],
      patterns: ['IaC basics', 'Container orchestration']
    }
  },
  {
    domain: 'DevOps',
    level: 'Mid',
    requirements: {
      skills: ['Cloud architecture', 'Security', 'Networking'],
      frameworks: ['Terraform', 'Prometheus', 'Grafana'],
      deliverables: ['IaC modules', 'DR plans'],
      patterns: ['Blue/green', 'Canary']
    }
  },
  {
    domain: 'DevOps',
    level: 'Senior',
    requirements: {
      skills: ['Scalable infra design', 'SRE practices', 'Cost optimization', 'Leadership'],
      frameworks: ['Kubernetes', 'Terraform', 'Cloud provider stack'],
      deliverables: ['Reference architectures', 'Runbooks'],
      patterns: ['GitOps', 'Multi-env']
    }
  },
  {
    domain: 'Game Dev',
    level: 'Fresher',
    requirements: {
      skills: ['C# basics', 'Unity fundamentals', 'Physics basics'],
      frameworks: ['Unity', 'Godot'],
      deliverables: ['Playable demo', 'README with GIFs'],
      patterns: ['Scene management', 'Component-based']
    }
  },
  {
    domain: 'Game Dev',
    level: 'Junior',
    requirements: {
      skills: ['Gameplay systems', 'Input', 'Animation', 'UI'],
      frameworks: ['Unity'],
      deliverables: ['CI build', 'Level design doc'],
      patterns: ['Entity/component', 'Event systems']
    }
  },
  {
    domain: 'Game Dev',
    level: 'Mid',
    requirements: {
      skills: ['Optimization', 'Profiling', 'Shaders basics', 'Asset pipeline'],
      frameworks: ['Unity'],
      deliverables: ['Profiling reports', 'Cross-platform builds'],
      patterns: ['ECS', 'Systems architecture']
    }
  },
  {
    domain: 'Game Dev',
    level: 'Senior',
    requirements: {
      skills: ['Architecture', 'Tools development', 'Mentoring'],
      frameworks: ['Unity', 'Godot'],
      deliverables: ['Build automation', 'Technical design docs'],
      patterns: ['Modular subsystems', 'Performance optimization patterns']
    }
  },
  {
    domain: 'Backend',
    level: 'Fresher',
    requirements: {
      skills: ['JavaScript', 'TypeScript', 'HTTP', 'REST basics', 'Git'],
      frameworks: ['Node.js', 'Express'],
      deliverables: ['API endpoints', 'README', 'Dockerized app'],
      patterns: ['MVC basics']
    }
  },
  {
    domain: 'Backend',
    level: 'Junior',
    requirements: {
      skills: ['SQL', 'ORM usage', 'Testing', 'Authentication'],
      frameworks: ['NestJS', 'Express'],
      deliverables: ['CI pipeline', 'Integration tests'],
      patterns: ['Repository pattern', 'Error handling']
    }
  },
  {
    domain: 'Backend',
    level: 'Mid',
    requirements: {
      skills: ['System design', 'Caching', 'Queues', 'Security'],
      frameworks: ['NestJS', 'GraphQL'],
      deliverables: ['Observability', 'Scalable modules'],
      patterns: ['Hexagonal', 'CQRS basics']
    }
  },
  {
    domain: 'Backend',
    level: 'Senior',
    requirements: {
      skills: ['Architecture', 'Performance optimization', 'Leadership'],
      frameworks: ['NestJS', 'Express', 'gRPC'],
      deliverables: ['Reference architecture', 'DR/HA'],
      patterns: ['Event-driven', 'Microservices']
    }
  },
  {
    domain: 'Fullstack',
    level: 'Fresher',
    requirements: {
      skills: ['HTML', 'CSS', 'JavaScript', 'Basic APIs', 'Git'],
      frameworks: ['React', 'Node.js'],
      deliverables: ['Simple fullstack app', 'README'],
      patterns: ['Client-server basics']
    }
  },
  {
    domain: 'Fullstack',
    level: 'Junior',
    requirements: {
      skills: ['TypeScript', 'Auth', 'Testing', 'DB modeling'],
      frameworks: ['Next.js', 'Express/NestJS'],
      deliverables: ['CI pipeline', 'E2E tests'],
      patterns: ['API design', 'State management']
    }
  },
  {
    domain: 'Fullstack',
    level: 'Mid',
    requirements: {
      skills: ['Performance', 'Accessibility', 'System design', 'Caching'],
      frameworks: ['Next.js', 'Prisma', 'GraphQL'],
      deliverables: ['Design system', 'Observability'],
      patterns: ['Feature modules', 'DDD basics']
    }
  },
  {
    domain: 'Fullstack',
    level: 'Senior',
    requirements: {
      skills: ['Architecture', 'Scaling', 'Leadership', 'Security'],
      frameworks: ['Next.js', 'NestJS'],
      deliverables: ['Monorepo setup', 'Perf budgets'],
      patterns: ['Microfrontends', 'Event-driven']
    }
  },
  {
    domain: 'Data Science',
    level: 'Fresher',
    requirements: {
      skills: ['Python', 'Statistics basics', 'SQL', 'Data cleaning'],
      frameworks: ['Pandas', 'NumPy', 'Jupyter'],
      deliverables: ['Notebook report', 'Visualizations'],
      patterns: ['EDA', 'Train/test split']
    }
  },
  {
    domain: 'Data Science',
    level: 'Junior',
    requirements: {
      skills: ['Modeling', 'Feature engineering', 'BI dashboards'],
      frameworks: ['scikit-learn', 'Tableau/PowerBI'],
      deliverables: ['Model evaluation', 'Dashboards'],
      patterns: ['Cross-validation', 'Pipelines']
    }
  },
  {
    domain: 'Data Science',
    level: 'Mid',
    requirements: {
      skills: ['Big data', 'MLOps basics', 'Deployment'],
      frameworks: ['Spark', 'MLflow'],
      deliverables: ['Data pipelines', 'Serving'],
      patterns: ['Versioning', 'Monitoring']
    }
  },
  {
    domain: 'Data Science',
    level: 'Senior',
    requirements: {
      skills: ['Advanced ML', 'Leadership', 'Experiment design'],
      frameworks: ['TensorFlow', 'PyTorch'],
      deliverables: ['Production models', 'SLOs'],
      patterns: ['A/B testing', 'Causal inference']
    }
  },
  {
    domain: 'iOS',
    level: 'Fresher',
    requirements: {
      skills: ['Swift basics', 'Xcode', 'UIKit basics'],
      frameworks: ['SwiftUI', 'UIKit'],
      deliverables: ['Simple app', 'README'],
      patterns: ['MVVM basics']
    }
  },
  {
    domain: 'iOS',
    level: 'Junior',
    requirements: {
      skills: ['Swift', 'Combine', 'Networking', 'Testing'],
      frameworks: ['SwiftUI', 'CoreData'],
      deliverables: ['CI with Fastlane', 'Unit/UI tests'],
      patterns: ['Architecture components']
    }
  },
  {
    domain: 'iOS',
    level: 'Mid',
    requirements: {
      skills: ['Performance optimization', 'Profiling', 'Accessibility'],
      frameworks: ['SwiftUI', 'UIKit'],
      deliverables: ['Crash monitoring', 'Automation'],
      patterns: ['Module structure', 'Dependency management']
    }
  },
  {
    domain: 'iOS',
    level: 'Senior',
    requirements: {
      skills: ['Architecture', 'Mentoring', 'Security'],
      frameworks: ['SwiftUI', 'UIKit', 'CoreData'],
      deliverables: ['Reference architecture', 'Scalable releases'],
      patterns: ['Modularization', 'Coordinator pattern']
    }
  }
]

export function getJobTaxonomy(): JobRequirementSet[] {
  return TAXONOMY
}

export function getRequirements(domain: Domain, level: Level): JobRequirementSet['requirements'] | null {
  const match = TAXONOMY.find(t => t.domain === domain && t.level === level)
  return match ? match.requirements : null
}
